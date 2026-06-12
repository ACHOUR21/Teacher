variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.29"
}

variable "vpc_id" {
  description = "VPC ID where the EKS cluster will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for EKS nodes"
  type        = list(string)
}

variable "desired_capacity" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 3
}

variable "min_size" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 3
}

variable "max_size" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 20
}

variable "instance_types" {
  description = "EC2 instance types for the EKS node group"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "public_access_cidrs" {
  description = "CIDR blocks that may access the EKS public endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "spot_instance_types" {
  description = "EC2 instance types for the EKS spot node group"
  type        = list(string)
  default     = ["t3.medium", "t3.large"]
}

variable "spot_desired_capacity" {
  description = "Desired number of spot worker nodes"
  type        = number
  default     = 2
}

variable "spot_min_size" {
  description = "Minimum number of spot worker nodes"
  type        = number
  default     = 0
}

variable "spot_max_size" {
  description = "Maximum number of spot worker nodes"
  type        = number
  default     = 20
}
