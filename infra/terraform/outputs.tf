# Stock Mind Visual Search Infrastructure Outputs

# S3 Bucket outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket for media storage"
  value       = aws_s3_bucket.media_bucket.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for media storage"
  value       = aws_s3_bucket.media_bucket.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.media_bucket.bucket_domain_name
}

output "s3_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = aws_s3_bucket.media_bucket.bucket_regional_domain_name
}

# SQS Queue outputs
output "sqs_queue_url" {
  description = "URL of the SQS queue for media processing"
  value       = aws_sqs_queue.media_processing_queue.url
}

output "sqs_queue_arn" {
  description = "ARN of the SQS queue for media processing"
  value       = aws_sqs_queue.media_processing_queue.arn
}

output "sqs_queue_name" {
  description = "Name of the SQS queue for media processing"
  value       = aws_sqs_queue.media_processing_queue.name
}

output "sqs_dlq_url" {
  description = "URL of the SQS dead letter queue"
  value       = aws_sqs_queue.media_processing_dlq.url
}

output "sqs_dlq_arn" {
  description = "ARN of the SQS dead letter queue"
  value       = aws_sqs_queue.media_processing_dlq.arn
}

# IAM outputs
output "media_worker_role_arn" {
  description = "ARN of the IAM role for media workers"
  value       = aws_iam_role.media_worker_role.arn
}

output "media_worker_role_name" {
  description = "Name of the IAM role for media workers"
  value       = aws_iam_role.media_worker_role.name
}

output "media_worker_instance_profile_arn" {
  description = "ARN of the IAM instance profile for media workers"
  value       = aws_iam_instance_profile.media_worker_profile.arn
}

output "media_worker_instance_profile_name" {
  description = "Name of the IAM instance profile for media workers"
  value       = aws_iam_instance_profile.media_worker_profile.name
}

# CloudWatch outputs
output "cloudwatch_log_group_worker" {
  description = "CloudWatch log group for worker logs"
  value       = aws_cloudwatch_log_group.media_worker_logs.name
}

output "cloudwatch_log_group_application" {
  description = "CloudWatch log group for application logs"
  value       = aws_cloudwatch_log_group.application_logs.name
}

# SNS outputs
output "sns_alerts_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts_topic.arn
}

output "sns_alerts_topic_name" {
  description = "Name of the SNS topic for alerts"
  value       = aws_sns_topic.alerts_topic.name
}

# Security Group outputs
output "media_worker_security_group_id" {
  description = "ID of the security group for media workers"
  value       = aws_security_group.media_worker_sg.id
}

output "media_worker_security_group_arn" {
  description = "ARN of the security group for media workers"
  value       = aws_security_group.media_worker_sg.arn
}

# CloudWatch Alarms outputs
output "queue_depth_alarm_arn" {
  description = "ARN of the queue depth alarm"
  value       = aws_cloudwatch_metric_alarm.queue_depth_alarm.arn
}

output "dlq_alarm_arn" {
  description = "ARN of the dead letter queue alarm"
  value       = aws_cloudwatch_metric_alarm.dlq_alarm.arn
}

# Configuration outputs for applications
output "worker_configuration" {
  description = "Configuration values for the worker application"
  value = {
    sqs_queue_url           = aws_sqs_queue.media_processing_queue.url
    sqs_dlq_url            = aws_sqs_queue.media_processing_dlq.url
    s3_bucket_name         = aws_s3_bucket.media_bucket.bucket
    aws_region             = var.aws_region
    log_group_worker       = aws_cloudwatch_log_group.media_worker_logs.name
    log_group_application  = aws_cloudwatch_log_group.application_logs.name
    security_group_id      = aws_security_group.media_worker_sg.id
    instance_profile_name  = aws_iam_instance_profile.media_worker_profile.name
  }
}

output "application_configuration" {
  description = "Configuration values for the Next.js application"
  value = {
    s3_bucket_name         = aws_s3_bucket.media_bucket.bucket
    s3_bucket_region       = var.aws_region
    sqs_queue_url          = aws_sqs_queue.media_processing_queue.url
    aws_region             = var.aws_region
  }
}

# Environment-specific outputs
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "aws_account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

# Resource counts for monitoring
output "resource_summary" {
  description = "Summary of created resources"
  value = {
    s3_buckets_created     = 1
    sqs_queues_created     = 2
    iam_roles_created      = 1
    iam_policies_created   = 1
    instance_profiles_created = 1
    security_groups_created = 1
    cloudwatch_log_groups_created = 2
    sns_topics_created     = 1
    cloudwatch_alarms_created = 2
  }
}

# URLs for easy access
output "aws_console_urls" {
  description = "AWS Console URLs for easy access to resources"
  value = {
    s3_bucket = "https://s3.console.aws.amazon.com/s3/buckets/${aws_s3_bucket.media_bucket.bucket}"
    sqs_queue = "https://${var.aws_region}.console.aws.amazon.com/sqs/v2/home?region=${var.aws_region}#/queues/${aws_sqs_queue.media_processing_queue.url}"
    cloudwatch_logs = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#logsV2:log-groups"
    sns_topics = "https://${var.aws_region}.console.aws.amazon.com/sns/v3/home?region=${var.aws_region}#/topics"
  }
}
