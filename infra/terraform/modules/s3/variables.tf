variable "bucket_name" {
  description = "Globally unique S3 bucket name"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "transition_to_ia_days" {
  description = "Number of days before objects are transitioned to STANDARD_IA"
  type        = number
  default     = 90
}

variable "transition_to_glacier_days" {
  description = "Number of days before objects are transitioned to GLACIER"
  type        = number
  default     = 365
}

variable "noncurrent_version_expiration_days" {
  description = "Number of days before non-current object versions are deleted"
  type        = number
  default     = 90
}
