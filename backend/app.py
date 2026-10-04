import hashlib
import hmac
import json
import os
import re
import time
from typing import Any
from urllib.parse import quote_plus

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.responses import Response
from gridfs.errors import NoFile
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv

from .seed import DEFAULT_DATA

load_dotenv()

app = FastAPI(title="Crab Plus Menu API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-File-Name"],
)

_mongo: AsyncIOMotorClient | None = None
_bearer = HTTPBearer(auto_error=False)


def _collection():
    global _mongo
    uri = os.getenv("MONGODB_URI")
    if not uri:
        host = os.getenv("MONGODB_HOST", "").strip()
        username = os.getenv("MONGODB_USERNAME", "")
        password = os.getenv("MONGODB_PASSWORD", "")
        if host and username and password:
            database = os.getenv("MONGODB_DB", "crab_plus")
            uri = (
                f"mongodb+srv://{quote_plus(username)}:{quote_plus(password)}@{host}/"
                f"{database}?retryWrites=true&w=majority"
            )
    if not uri:
        return None
    if _mongo is None:
        _mongo = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=3500)
    return _mongo[os.getenv("MONGODB_DB", "crab_plus")]["site_data"]


def _image_bucket():
    collection = _collection()
    if collection is None:
        return None
    return AsyncIOMotorGridFSBucket(collection.database, bucket_name="menu_images")


def _referenced_image_ids(data: dict[str, Any]) -> set[ObjectId]:
    ids: set[ObjectId] = set()
    values = []
    for item in data.get("items", []):
        values.extend([item.get("image"), *(item.get("images") or [])])
    for offer in data.get("offers", []):
        values.extend([offer.get("image"), offer.get("image_url"), *(offer.get("images") or [])])
    for value in values:
        if isinstance(value, str):
            match = re.search(r"/api/images/([a-fA-F0-9]{24})(?:$|[?#])", value)
            if match:
                ids.add(ObjectId(match.group(1)))
    return ids


async def _prune_unused_images(data: dict[str, Any]):
    bucket = _image_bucket()
    collection = _collection()
    if bucket is None or collection is None:
        return
    keep = _referenced_image_ids(data)
    async for file_doc in collection.database["menu_images.files"].find({}, {"_id": 1}):
        if file_doc["_id"] not in keep:
            await bucket.delete(file_doc["_id"])


async def _read_data() -> dict[str, Any]:
    collection = _collection()
    if collection is None:
        return DEFAULT_DATA
    try:
        doc = await collection.find_one({"_id": "main"})
        if not doc or "data" not in doc:
            return DEFAULT_DATA
        data = doc["data"]
        if not doc.get("social_links_v1"):
            settings = data.setdefault("settings", {}) or {}
            data["settings"] = settings
            for key in ("instagram", "tiktok", "snapchat", "facebook"):
                if not settings.get(key):
                    settings[key] = DEFAULT_DATA["settings"][key]
            try:
                await collection.update_one(
                    {"_id": "main"},
                    {"$set": {"data": data, "social_links_v1": True}},
                )
            except Exception:
                pass
        return data
    except Exception:
        return DEFAULT_DATA


def _sign(payload: str) -> str:
    secret = os.getenv("ADMIN_SECRET", "")
    if not secret:
        raise HTTPException(status_code=503, detail="عيّن ADMIN_SECRET في إعدادات الخادم")
    return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()


def _new_token() -> str:
    payload = str(int(time.time()) + 60 * 60 * 12)
    return f"{payload}.{_sign(payload)}"


async def require_admin(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer)):
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="سجل دخولك أولًا")
    try:
        expires, signature = credentials.credentials.split(".", 1)
        valid = int(expires) > int(time.time()) and hmac.compare_digest(signature, _sign(expires))
    except (ValueError, TypeError):
        valid = False
    if not valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="انتهت صلاحية الجلسة، سجل دخولك مجددًا")
    return True


@app.get("/api/health")
async def health():
    configured = bool(os.getenv("MONGODB_URI") or (os.getenv("MONGODB_HOST") and os.getenv("MONGODB_USERNAME") and os.getenv("MONGODB_PASSWORD")))
    return {"status": "ok", "database_configured": configured}


@app.get("/api/public")
async def public_data():
    return await _read_data()


@app.post("/api/admin/images", dependencies=[Depends(require_admin)])
async def upload_admin_image(request: Request):
    bucket = _image_bucket()
    if bucket is None:
        raise HTTPException(status_code=503, detail="عيّن بيانات اتصال MongoDB لرفع الصور")

    content_type = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    signatures = {
        "image/jpeg": lambda data: data.startswith(b"\xff\xd8\xff"),
        "image/png": lambda data: data.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/webp": lambda data: len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP",
        "image/gif": lambda data: data.startswith((b"GIF87a", b"GIF89a")),
    }
    if content_type not in signatures:
        raise HTTPException(status_code=415, detail="ارفع صورة بصيغة JPG أو PNG أو WEBP أو GIF")

    max_bytes = 4 * 1024 * 1024
    try:
        if int(request.headers.get("content-length", "0")) > max_bytes:
            raise HTTPException(status_code=413, detail="حجم الصورة يجب ألا يتجاوز 4 ميجابايت")
    except ValueError:
        pass

    image = bytearray()
    async for chunk in request.stream():
        image.extend(chunk)
        if len(image) > max_bytes:
            raise HTTPException(status_code=413, detail="حجم الصورة يجب ألا يتجاوز 4 ميجابايت")
    if not image or not signatures[content_type](image):
        raise HTTPException(status_code=415, detail="محتوى الملف لا يطابق صيغة الصورة المحددة")

    filename = request.headers.get("x-file-name", "image")[:180]
    try:
        image_id = await bucket.upload_from_stream(
            filename,
            bytes(image),
            metadata={"contentType": content_type},
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail="تعذر حفظ الصورة في MongoDB") from exc
    return {"url": f"/api/images/{image_id}"}


@app.get("/api/images/{image_id}")
async def get_uploaded_image(image_id: str):
    bucket = _image_bucket()
    if bucket is None:
        raise HTTPException(status_code=503, detail="قاعدة البيانات غير متاحة")
    try:
        image = await bucket.open_download_stream(ObjectId(image_id))
        content = await image.read()
    except (NoFile, InvalidId, ValueError):
        raise HTTPException(status_code=404, detail="الصورة غير موجودة")
    except Exception as exc:
        raise HTTPException(status_code=503, detail="تعذر تحميل الصورة من MongoDB") from exc
    content_type = (image.metadata or {}).get("contentType", "application/octet-stream")
    return Response(content, media_type=content_type, headers={"Cache-Control": "public, max-age=31536000, immutable"})


@app.post("/api/admin/login")
async def admin_login(body: dict[str, Any]):
    password = os.getenv("ADMIN_PASSWORD", "")
    if not password:
        raise HTTPException(status_code=503, detail="عيّن ADMIN_PASSWORD في إعدادات الخادم")
    if not hmac.compare_digest(str(body.get("password", "")), password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="كلمة المرور غير صحيحة")
    return {"token": _new_token(), "expires_in": 43200}


@app.put("/api/admin/data", dependencies=[Depends(require_admin)])
async def save_data(body: dict[str, Any]):
    required = {"categories", "items", "offers", "settings"}
    if not required.issubset(body):
        raise HTTPException(status_code=422, detail="البيانات ناقصة")
    if not isinstance(body["categories"], list) or not isinstance(body["items"], list):
        raise HTTPException(status_code=422, detail="صيغة المنيو غير صحيحة")
    collection = _collection()
    if collection is None:
        raise HTTPException(status_code=503, detail="عيّن بيانات اتصال MongoDB لحفظ التغييرات")
    try:
        await collection.replace_one(
            {"_id": "main"},
            {"_id": "main", "data": body, "social_links_v1": True, "gallery_demo_v1": True},
            upsert=True,
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail="تعذر الاتصال بقاعدة البيانات") from exc
    try:
        await _prune_unused_images(body)
    except Exception:
        pass
    return {"ok": True}


@app.get("/api/admin/data", dependencies=[Depends(require_admin)])
async def admin_data():
    return await _read_data()


@app.post("/api/admin/images/prune", dependencies=[Depends(require_admin)])
async def prune_admin_images():
    collection = _collection()
    if collection is None:
        raise HTTPException(status_code=503, detail="قاعدة البيانات غير متاحة")
    data = await _read_data()
    try:
        await _prune_unused_images(data)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="تعذر تنظيف الصور غير المستخدمة") from exc
    return {"ok": True}
