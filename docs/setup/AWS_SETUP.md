# AWS S3 Setup Guide

## 1. Create AWS Account and S3 Bucket

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to S3 service
3. Create a new bucket named `quick-stock-media`
4. Choose a region (e.g., us-east-1)
5. Configure bucket settings:
   - Block all public access: **Uncheck** (we need public read for media)
   - Bucket Versioning: Enable
   - Server-side encryption: Enable

## 2. Create IAM User for S3 Access

1. Go to IAM service in AWS Console
2. Create a new user: `quick-stock-s3-user`
3. Attach the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::quick-stock-media/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::quick-stock-media"
        }
    ]
}
```

4. Create access keys for the user
5. Note down the Access Key ID and Secret Access Key

## 3. Environment Variables

Add these to your `.env.local` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="quick-stock-media"
```

## 4. S3 Bucket Policy

Add this bucket policy to allow public read access for media files:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::quick-stock-media/*"
        }
    ]
}
```

## 5. CORS Configuration

Add this CORS configuration to your S3 bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
        "ExposeHeaders": ["ETag"]
    }
]
```

## 6. Folder Structure

The S3 bucket will organize files using the following structure:

```
quick-stock-media/
├── clients/
│   ├── {client-id-1}/
│   │   └── products/
│   │       ├── {product-sku-1}/
│   │       │   └── media/
│   │       │       ├── image/
│   │       │       │   ├── {timestamp}-{random}.jpg
│   │       │       │   └── {timestamp}-{random}.png
│   │       │       ├── video/
│   │       │       │   └── {timestamp}-{random}.mp4
│   │       │       └── thumbnails/
│   │       │           └── {timestamp}-{random}.jpg
│   │       └── {product-sku-2}/
│   │           └── media/
│   │               └── ...
│   └── {client-id-2}/
│       └── products/
│           └── ...
```

### Benefits of this structure:
- **Client Isolation**: Each client's files are completely separated
- **Product Organization**: Files are organized by product SKU
- **Media Type Separation**: Images, videos, and thumbnails are in separate folders
- **Easy Management**: Simple to find, manage, and delete files
- **Scalable**: Can handle thousands of clients and products

## 7. Test the Setup

After completing the setup, restart your development server and test the media upload functionality.
