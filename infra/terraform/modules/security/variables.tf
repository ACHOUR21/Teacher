variable "project_name" {
  description = "Short project identifier used as a prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the security groups will be created"
  type        = string
}

variable "eks_node_sg_id" {
  description = "Security group ID of the EKS worker nodes (used to scope DB/Redis ingress rules)"
  type        = string
}
