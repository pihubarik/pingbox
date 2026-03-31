from minio import Minio
from minio.error import S3Error
from app.core.config import settings
import uuid
import io

client = Minio(
    settings.minio_endpoint,
    access_key=settings.minio_access_key,
    secret_key=settings.minio_secret_key,
    secure=False
)

BUCKET = "pingbox-media"

def ensure_bucket():
    try:
        if not client.bucket_exists(BUCKET):
            client.make_bucket(BUCKET)
            # Make bucket public so media URLs work directly
            policy = f'''{{
                "Version": "2012-10-17",
                "Statement": [{{
                    "Effect": "Allow",
                    "Principal": {{"AWS": ["*"]}},
                    "Action": ["s3:GetObject"],
                    "Resource": ["arn:aws:s3:::{BUCKET}/*"]
                }}]
            }}'''
            client.set_bucket_policy(BUCKET, policy)
    except S3Error as e:
        print(f"MinIO error: {e}")

async def upload_file(file_bytes: bytes, filename: str, content_type: str) -> str:
    ensure_bucket()
    ext = filename.split(".")[-1] if "." in filename else "bin"
    object_name = f"{uuid.uuid4()}.{ext}"
    client.put_object(
        BUCKET,
        object_name,
        io.BytesIO(file_bytes),
        length=len(file_bytes),
        content_type=content_type
    )
    url = f"http://{settings.minio_endpoint}/{BUCKET}/{object_name}"
    return url
