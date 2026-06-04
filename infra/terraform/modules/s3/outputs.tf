output "bucket_id" {
  description = "S3 bucket name (ID)"
  value       = aws_s3_bucket.main.id
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.main.arn
}

output "bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket (used as CloudFront origin)"
  value       = aws_s3_bucket.main.bucket_regional_domain_name
}

output "origin_access_identity_id" {
  description = "CloudFront origin access identity ID"
  value       = aws_cloudfront_origin_access_identity.main.id
}

output "origin_access_identity_iam_arn" {
  description = "Pre-built IAM ARN for the CloudFront OAI (used in bucket policy)"
  value       = aws_cloudfront_origin_access_identity.main.iam_arn
}

output "origin_access_identity_path" {
  description = "CloudFront OAI path for use in distribution config"
  value       = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
}
