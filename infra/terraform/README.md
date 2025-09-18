# Stock Mind Visual Search Infrastructure

This Terraform configuration sets up the AWS infrastructure for the Stock Mind visual search system, including S3 storage, SQS queues, and event notifications.

## Architecture

```
S3 Bucket (Media Storage)
    ↓ (ObjectCreated events)
SQS Queue (Media Processing)
    ↓ (Worker processes)
PostgreSQL + pgvector (Embeddings)
```

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate permissions
- AWS account with necessary permissions

## Quick Start

1. **Configure AWS credentials**
```bash
aws configure
# Or use environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

2. **Copy and customize configuration**
```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

3. **Initialize Terraform**
```bash
terraform init
```

4. **Plan the deployment**
```bash
terraform plan
```

5. **Apply the configuration**
```bash
terraform apply
```

6. **Get outputs**
```bash
terraform output
```

## Configuration

### Required Variables

- `s3_bucket_name`: Globally unique S3 bucket name for media storage
- `aws_region`: AWS region for resources

### Optional Variables

See `variables.tf` for a complete list of configurable options.

## Resources Created

### S3
- Media storage bucket with versioning and encryption
- CORS configuration for web uploads
- Public access blocking for security

### SQS
- Main processing queue for media files
- Dead letter queue for failed messages
- Queue policies allowing S3 to send messages

### IAM
- Role and policy for worker instances
- Instance profile for EC2 workers

### CloudWatch
- Log groups for worker and application logs
- Alarms for queue depth and DLQ monitoring

### SNS
- Topic for alert notifications

### Security
- Security group for worker instances
- Proper egress rules for AWS services

## Event Notifications

The configuration sets up S3 event notifications for the following file types:
- Images: `.jpg`, `.jpeg`, `.png`, `.webp`
- Videos: `.mp4`, `.webm`

Events are filtered to only include files in the `clients/` prefix to match the expected folder structure.

## Message Format

SQS messages sent by S3 will have the following structure:
```json
{
  "Records": [
    {
      "eventVersion": "2.1",
      "eventSource": "aws:s3",
      "awsRegion": "us-east-1",
      "eventTime": "2023-01-01T00:00:00.000Z",
      "eventName": "ObjectCreated:Put",
      "s3": {
        "bucket": {
          "name": "your-bucket-name",
          "arn": "arn:aws:s3:::your-bucket-name"
        },
        "object": {
          "key": "clients/client-123/products/sku/media/image/file.jpg",
          "size": 1024000
        }
      }
    }
  ]
}
```

## Worker Configuration

The worker process should be configured with the following environment variables:

```bash
SQS_QUEUE_URL="https://sqs.us-east-1.amazonaws.com/123456789012/stock-mind-media-queue"
S3_BUCKET_NAME="your-bucket-name"
AWS_REGION="us-east-1"
DATABASE_URL="postgresql://user:pass@host:port/db"
EMBEDDING_SERVICE_URL="http://your-embedding-service:8000"
```

## Monitoring

### CloudWatch Alarms

1. **Queue Depth Alarm**: Triggers when queue has more than 1000 messages
2. **DLQ Alarm**: Triggers when any messages are sent to the dead letter queue

### Log Groups

1. **Worker Logs**: `/aws/ec2/stock-mind/media-worker`
2. **Application Logs**: `/aws/ec2/stock-mind/application`

## Scaling

### Horizontal Scaling

To scale the worker process:

1. **Manual Scaling**: Launch additional EC2 instances with the worker instance profile
2. **Auto Scaling**: Enable auto scaling in the Terraform configuration
3. **Container Scaling**: Use ECS or EKS for container-based scaling

### Vertical Scaling

To scale individual workers:

1. **Instance Type**: Change `worker_instance_type` variable
2. **Memory**: Use instances with more RAM for larger files
3. **CPU**: Use instances with more CPU for faster processing

## Security

### IAM Permissions

The worker role has the following permissions:
- S3: GetObject, PutObject, DeleteObject on the media bucket
- SQS: ReceiveMessage, DeleteMessage, GetQueueAttributes, ChangeMessageVisibility
- SQS: SendMessage to the dead letter queue

### Network Security

The security group allows:
- Outbound HTTPS (443) for AWS API calls
- Outbound HTTP (8000) for embedding service
- Outbound PostgreSQL (5432) for database

### Data Protection

- S3 bucket has server-side encryption enabled
- Public access is blocked
- Versioning is enabled for data recovery

## Troubleshooting

### Common Issues

1. **S3 Event Notifications Not Working**
   - Check SQS queue policy allows S3 to send messages
   - Verify bucket notification configuration
   - Check CloudTrail for S3 API calls

2. **Worker Can't Access SQS**
   - Verify IAM role and policy are attached
   - Check security group allows outbound HTTPS
   - Verify SQS queue URL is correct

3. **High Queue Depth**
   - Scale up workers
   - Check for processing errors in logs
   - Verify embedding service is healthy

### Debugging Commands

```bash
# Check SQS queue attributes
aws sqs get-queue-attributes --queue-url $QUEUE_URL --attribute-names All

# Check S3 bucket notifications
aws s3api get-bucket-notification-configuration --bucket $BUCKET_NAME

# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix "/aws/ec2/stock-mind"

# Check IAM role permissions
aws iam get-role --role-name $ROLE_NAME
aws iam list-attached-role-policies --role-name $ROLE_NAME
```

## Cost Optimization

### S3 Costs
- Use S3 Intelligent Tiering for automatic cost optimization
- Set lifecycle policies for old versions
- Use S3 Transfer Acceleration only if needed

### SQS Costs
- Use long polling to reduce API calls
- Set appropriate message retention period
- Monitor dead letter queue for cost impact

### EC2 Costs
- Use Spot instances for non-critical workloads
- Right-size instances based on actual usage
- Use Reserved Instances for predictable workloads

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all data in the S3 bucket and SQS queues. Make sure to backup any important data before running destroy.

## Support

For issues with this infrastructure:

1. Check the troubleshooting section above
2. Review CloudWatch logs for errors
3. Verify all environment variables are set correctly
4. Check AWS service limits and quotas

## Contributing

When modifying this infrastructure:

1. Update the README with any new resources or configurations
2. Add appropriate outputs for new resources
3. Include validation rules for new variables
4. Test changes in a development environment first
5. Update the runbook with any operational changes
