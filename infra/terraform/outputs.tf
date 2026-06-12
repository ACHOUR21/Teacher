output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = module.vpc.private_subnet_ids
}

output "nat_gateway_public_ip" {
  description = "Public IP of the NAT Gateway"
  value       = module.vpc.nat_gateway_public_ip
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API server endpoint"
  value       = module.eks.cluster_endpoint
  sensitive   = false
}

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_cluster_certificate_authority" {
  description = "Base64-encoded certificate authority data for the EKS cluster"
  value       = module.eks.cluster_ca_certificate
  sensitive   = true
}

output "eks_node_group_role_arn" {
  description = "IAM role ARN for the EKS node group"
  value       = module.eks.node_group_role_arn
}

output "eks_oidc_provider_arn" {
  description = "ARN of the IAM OIDC provider (used for IRSA)"
  value       = module.eks.oidc_provider_arn
}

output "rds_endpoint" {
  description = "RDS PostgreSQL instance endpoint (host:port)"
  value       = module.rds.db_endpoint
  sensitive   = false
}

output "rds_address" {
  description = "RDS PostgreSQL hostname"
  value       = module.rds.db_address
}

output "rds_port" {
  description = "RDS PostgreSQL port"
  value       = module.rds.db_port
}

output "rds_database_name" {
  description = "Name of the RDS database"
  value       = module.rds.db_name
}

output "rds_password_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the RDS master password"
  value       = module.rds.db_password_secret_arn
  sensitive   = true
}

output "redis_primary_endpoint" {
  description = "ElastiCache Redis primary endpoint address"
  value       = module.elasticache.primary_endpoint_address
  sensitive   = false
}

output "redis_reader_endpoint" {
  description = "ElastiCache Redis reader endpoint address"
  value       = module.elasticache.reader_endpoint_address
  sensitive   = false
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = module.elasticache.port
}

output "redis_auth_token_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the Redis AUTH token"
  value       = module.elasticache.auth_token_secret_arn
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 assets bucket"
  value       = module.s3.bucket_id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 assets bucket"
  value       = module.s3.bucket_arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name (e.g., dXXXXXXXXXXXX.cloudfront.net)"
  value       = module.cloudfront.domain_name
}

output "alb_security_group_id" {
  description = "Security group ID for the ALB"
  value       = module.security.alb_security_group_id
}

output "api_security_group_id" {
  description = "Security group ID for the API service"
  value       = module.security.api_security_group_id
}

output "web_security_group_id" {
  description = "Security group ID for the web frontend"
  value       = module.security.web_security_group_id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS (from security module)"
  value       = module.security.rds_security_group_id
}

output "redis_security_group_id" {
  description = "Security group ID for Redis (from security module)"
  value       = module.security.redis_security_group_id
}

output "kubeconfig_update_command" {
  description = "AWS CLI command to update local kubeconfig for this cluster"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}
