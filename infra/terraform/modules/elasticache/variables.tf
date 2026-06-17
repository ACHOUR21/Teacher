variable "cluster_id" {
  description = "Identifier for the ElastiCache replication group"
  type        = string
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.1"
}

variable "num_cache_nodes" {
  description = "Number of cache nodes (1 primary + replicas)"
  type        = number
  default     = 2
}

variable "automatic_failover_enabled" {
  description = "Enable automatic failover (requires num_cache_nodes >= 2)"
  type        = bool
  default     = true
}

variable "multi_az_enabled" {
  description = "Enable Multi-AZ for the replication group"
  type        = bool
  default     = true
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the ElastiCache subnet group"
  type        = list(string)
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to connect to Redis"
  type        = list(string)
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "notification_topic_arn" {
  description = "SNS topic ARN for ElastiCache event notifications"
  type        = string
  default     = ""
}

variable "alarm_actions" {
  description = "List of ARNs to notify when a CloudWatch alarm fires"
  type        = list(string)
  default     = []
}
