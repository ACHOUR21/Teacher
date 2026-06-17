variable "s3_bucket_regional_domain" {
  description = "Regional domain name of the S3 origin bucket"
  type        = string
}

variable "s3_bucket_id" {
  description = "S3 bucket ID (used for logging destination)"
  type        = string
}

variable "origin_access_identity" {
  description = "CloudFront origin access identity IAM ARN for S3 bucket policy"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}

variable "domain_aliases" {
  description = "Alternate domain names (CNAMEs) for the CloudFront distribution"
  type        = list(string)
  default     = ["assets.eduai.io"]
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for HTTPS (must be in us-east-1)"
  type        = string
  default     = ""
}

variable "waf_web_acl_id" {
  description = "ARN of the WAF Web ACL to associate with the distribution"
  type        = string
  default     = ""
}
