# Stock Mind Visual Search Infrastructure
# This Terraform configuration sets up S3, SQS, and event notifications
# for the visual search media processing pipeline

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# S3 Bucket for media storage
resource "aws_s3_bucket" "media_bucket" {
  bucket = var.s3_bucket_name

  tags = {
    Name        = "Stock Mind Media Storage"
    Environment = var.environment
    Project     = "stock-mind"
  }
}

# S3 Bucket versioning
resource "aws_s3_bucket_versioning" "media_bucket_versioning" {
  bucket = aws_s3_bucket.media_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "media_bucket_encryption" {
  bucket = aws_s3_bucket.media_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket public access block
resource "aws_s3_bucket_public_access_block" "media_bucket_pab" {
  bucket = aws_s3_bucket.media_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket CORS configuration
resource "aws_s3_bucket_cors_configuration" "media_bucket_cors" {
  bucket = aws_s3_bucket.media_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# SQS Queue for media processing
resource "aws_sqs_queue" "media_processing_queue" {
  name                       = var.sqs_queue_name
  visibility_timeout_seconds = var.sqs_visibility_timeout
  message_retention_seconds  = var.sqs_message_retention
  receive_wait_time_seconds  = var.sqs_receive_wait_time
  max_message_size          = var.sqs_max_message_size

  # Dead letter queue configuration
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.media_processing_dlq.arn
    maxReceiveCount     = var.sqs_max_receive_count
  })

  tags = {
    Name        = "Stock Mind Media Processing Queue"
    Environment = var.environment
    Project     = "stock-mind"
  }
}

# Dead Letter Queue for failed messages
resource "aws_sqs_queue" "media_processing_dlq" {
  name                      = "${var.sqs_queue_name}-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name        = "Stock Mind Media Processing DLQ"
    Environment = var.environment
    Project     = "stock-mind"
  }
}

# SQS Queue policy to allow S3 to send messages
resource "aws_sqs_queue_policy" "media_processing_queue_policy" {
  queue_url = aws_sqs_queue.media_processing_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowS3ToSendMessage"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.media_processing_queue.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_s3_bucket.media_bucket.arn
          }
        }
      }
    ]
  })
}

# S3 Event Notification for Object Created events
resource "aws_s3_bucket_notification" "media_bucket_notification" {
  bucket = aws_s3_bucket.media_bucket.id

  queue {
    queue_arn     = aws_sqs_queue.media_processing_queue.arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "clients/"
    filter_suffix = ".jpg"
  }

  queue {
    queue_arn     = aws_sqs_queue.media_processing_queue.arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "clients/"
    filter_suffix = ".jpeg"
  }

  queue {
    queue_arn     = aws_sqs_queue.media_processing_queue.arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "clients/"
    filter_suffix = ".png"
  }

  queue {
    queue_arn     = aws_sqs_queue.media_processing_queue.arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "clients/"
    filter_suffix = ".webp"
  }

  queue {
    queue_arn     = aws_sqs_queue.media_processing_queue.arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "clients/"
    filter_suffix = ".mp4"
  }

  queue {
    queue_arn     = aws_sqs_queue.media_processing_queue.arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "clients/"
    filter_suffix = ".webm"
  }

  depends_on = [aws_sqs_queue_policy.media_processing_queue_policy]
}

# IAM Role for the worker process
resource "aws_iam_role" "media_worker_role" {
  name = "${var.environment}-media-worker-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "Media Worker Role"
    Environment = var.environment
    Project     = "stock-mind"
  }
}

# IAM Policy for the worker process
resource "aws_iam_policy" "media_worker_policy" {
  name        = "${var.environment}-media-worker-policy"
  description = "Policy for media processing worker"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.media_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility"
        ]
        Resource = [
          aws_sqs_queue.media_processing_queue.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = [
          aws_sqs_queue.media_processing_dlq.arn
        ]
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "media_worker_policy_attachment" {
  role       = aws_iam_role.media_worker_role.name
  policy_arn = aws_iam_policy.media_worker_policy.arn
}

# IAM Instance Profile for EC2 instances
resource "aws_iam_instance_profile" "media_worker_profile" {
  name = "${var.environment}-media-worker-profile"
  role = aws_iam_role.media_worker_role.name

  tags = {
    Name        = "Media Worker Instance Profile"
    Environment = var.environment
    Project     = "stock-mind"
  }
}

# CloudWatch Log Group for worker logs
resource "aws_cloudwatch_log_group" "media_worker_logs" {
  name              = "/aws/ec2/stock-mind/media-worker"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "Media Worker Logs"
    Environment = var.environment
    Project     = "stock-mind"
  }
}

# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "application_logs" {
  name              = "/aws/ec2/stock-mind/application"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "Application Logs"
    Environment = var.environment
    Project     = "stock-mind"
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts_topic" {
  name = "${var.environment}-stock-mind-alerts"

  tags = {
    Name        = "Stock Mind Alerts"
    Environment = var.environment
    Project     = "stock-mind"
  }
}

# CloudWatch Alarm for queue depth
resource "aws_cloudwatch_metric_alarm" "queue_depth_alarm" {
  alarm_name          = "${var.environment}-sqs-queue-depth"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApproximateNumberOfVisibleMessages"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.queue_depth_threshold
  alarm_description   = "This metric monitors SQS queue depth"
  alarm_actions       = [aws_sns_topic.alerts_topic.arn]

  dimensions = {
    QueueName = aws_sqs_queue.media_processing_queue.name
  }

  tags = {
    Name        = "Queue Depth Alarm"
    Environment = var.environment
    Project     = "stock-mind"
  }
}

# CloudWatch Alarm for dead letter queue
resource "aws_cloudwatch_metric_alarm" "dlq_alarm" {
  alarm_name          = "${var.environment}-sqs-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfVisibleMessages"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "This metric monitors dead letter queue messages"
  alarm_actions       = [aws_sns_topic.alerts_topic.arn]

  dimensions = {
    QueueName = aws_sqs_queue.media_processing_dlq.name
  }

  tags = {
    Name        = "DLQ Alarm"
    Environment = var.environment
    Project     = "stock-mind"
  }
}

# Security Group for worker instances
resource "aws_security_group" "media_worker_sg" {
  name_prefix = "${var.environment}-media-worker-"
  vpc_id      = var.vpc_id

  # Outbound HTTPS for AWS API calls
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound HTTP for embedding service
  egress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound PostgreSQL
  egress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "Media Worker Security Group"
    Environment = var.environment
    Project     = "stock-mind"
  }
}
