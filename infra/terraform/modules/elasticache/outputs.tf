output "primary_endpoint_address" {
  description = "Primary endpoint address for the ElastiCache Redis replication group"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "reader_endpoint_address" {
  description = "Reader endpoint address for the ElastiCache Redis replication group"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
}

output "port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.main.port
}

output "replication_group_id" {
  description = "ElastiCache replication group identifier"
  value       = aws_elasticache_replication_group.main.replication_group_id
}

output "security_group_id" {
  description = "Security group ID attached to the ElastiCache cluster"
  value       = aws_security_group.redis.id
}

output "auth_token_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the Redis AUTH token"
  value       = aws_secretsmanager_secret.redis_auth_token.arn
  sensitive   = true
}
