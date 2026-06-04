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

output "rds_endpoint" {
  description = "RDS PostgreSQL cluster endpoint (write)"
  value       = module.rds.db_endpoint
  sensitive   = false
}

output "rds_reader_endpoint" {
  description = "RDS PostgreSQL read-replica endpoint"
  value       = module.rds.db_reader_endpoint
  sensitive   = false
}

output "rds_port" {
  description = "RDS PostgreSQL port"
  value       = module.rds.db_port
}

output "rds_database_name" {
  description = "Name of the RDS database"
  value       = module.rds.db_name
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

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "kubeconfig_update_command" {
  description = "AWS CLI command to update local kubeconfig for this cluster"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}
