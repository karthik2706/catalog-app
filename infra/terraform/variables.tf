# Stock Mind Visual Search Infrastructure Variables

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket for media storage"
  type        = string
  
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*[a-z0-9]$", var.s3_bucket_name))
    error_message = "S3 bucket name must be lowercase, alphanumeric, and can contain hyphens."
  }
}

variable "allowed_origins" {
  description = "List of allowed origins for S3 CORS configuration"
  type        = list(string)
  default     = ["*"]
}

variable "sqs_queue_name" {
  description = "Name of the SQS queue for media processing"
  type        = string
  default     = "stock-mind-media-queue"
}

variable "sqs_visibility_timeout" {
  description = "Visibility timeout for SQS queue in seconds"
  type        = number
  default     = 300
  
  validation {
    condition     = var.sqs_visibility_timeout >= 0 && var.sqs_visibility_timeout <= 43200
    error_message = "SQS visibility timeout must be between 0 and 43200 seconds (12 hours)."
  }
}

variable "sqs_message_retention" {
  description = "Message retention period for SQS queue in seconds"
  type        = number
  default     = 1209600 # 14 days
  
  validation {
    condition     = var.sqs_message_retention >= 60 && var.sqs_message_retention <= 1209600
    error_message = "SQS message retention must be between 60 seconds and 1209600 seconds (14 days)."
  }
}

variable "sqs_receive_wait_time" {
  description = "Receive wait time for SQS queue in seconds (0 for short polling, >0 for long polling)"
  type        = number
  default     = 20
  
  validation {
    condition     = var.sqs_receive_wait_time >= 0 && var.sqs_receive_wait_time <= 20
    error_message = "SQS receive wait time must be between 0 and 20 seconds."
  }
}

variable "sqs_max_message_size" {
  description = "Maximum message size for SQS queue in bytes"
  type        = number
  default     = 262144 # 256KB
  
  validation {
    condition     = var.sqs_max_message_size >= 1024 && var.sqs_max_message_size <= 262144
    error_message = "SQS max message size must be between 1024 bytes and 262144 bytes (256KB)."
  }
}

variable "sqs_max_receive_count" {
  description = "Maximum number of times a message can be received before being sent to DLQ"
  type        = number
  default     = 3
  
  validation {
    condition     = var.sqs_max_receive_count >= 1 && var.sqs_max_receive_count <= 1000
    error_message = "SQS max receive count must be between 1 and 1000."
  }
}

variable "queue_depth_threshold" {
  description = "Threshold for queue depth alarm"
  type        = number
  default     = 1000
  
  validation {
    condition     = var.queue_depth_threshold > 0
    error_message = "Queue depth threshold must be greater than 0."
  }
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
  
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 3653], var.log_retention_days)
    error_message = "Log retention days must be one of the valid CloudWatch log retention periods."
  }
}

variable "vpc_id" {
  description = "VPC ID for security group (optional, leave empty for default VPC)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Optional: Database configuration
variable "database_host" {
  description = "Database host for worker configuration"
  type        = string
  default     = ""
}

variable "database_port" {
  description = "Database port for worker configuration"
  type        = number
  default     = 5432
}

variable "database_name" {
  description = "Database name for worker configuration"
  type        = string
  default     = ""
}

# Optional: Embedding service configuration
variable "embedding_service_url" {
  description = "URL of the embedding service for worker configuration"
  type        = string
  default     = ""
}

# Optional: Notification configuration
variable "notification_email" {
  description = "Email address for SNS notifications"
  type        = string
  default     = ""
}

variable "notification_phone" {
  description = "Phone number for SNS notifications (E.164 format)"
  type        = string
  default     = ""
}

# Optional: Scaling configuration
variable "min_worker_instances" {
  description = "Minimum number of worker instances"
  type        = number
  default     = 1
  
  validation {
    condition     = var.min_worker_instances >= 0
    error_message = "Minimum worker instances must be 0 or greater."
  }
}

variable "max_worker_instances" {
  description = "Maximum number of worker instances"
  type        = number
  default     = 10
  
  validation {
    condition     = var.max_worker_instances >= var.min_worker_instances
    error_message = "Maximum worker instances must be greater than or equal to minimum worker instances."
  }
}

# Optional: Instance configuration
variable "worker_instance_type" {
  description = "EC2 instance type for workers"
  type        = string
  default     = "t3.medium"
}

variable "worker_ami_id" {
  description = "AMI ID for worker instances (leave empty for latest Amazon Linux 2)"
  type        = string
  default     = ""
}

variable "worker_key_name" {
  description = "EC2 key pair name for worker instances"
  type        = string
  default     = ""
}

# Optional: Auto Scaling configuration
variable "enable_auto_scaling" {
  description = "Enable auto scaling for worker instances"
  type        = bool
  default     = false
}

variable "scale_up_cooldown" {
  description = "Cooldown period for scale up actions in seconds"
  type        = number
  default     = 300
  
  validation {
    condition     = var.scale_up_cooldown >= 0
    error_message = "Scale up cooldown must be 0 or greater."
  }
}

variable "scale_down_cooldown" {
  description = "Cooldown period for scale down actions in seconds"
  type        = number
  default     = 300
  
  validation {
    condition     = var.scale_down_cooldown >= 0
    error_message = "Scale down cooldown must be 0 or greater."
  }
}
