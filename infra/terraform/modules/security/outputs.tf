output "alb_security_group_id" {
  description = "Security group ID for the Application Load Balancer"
  value       = aws_security_group.alb.id
}

output "api_security_group_id" {
  description = "Security group ID for the NestJS API service"
  value       = aws_security_group.api.id
}

output "web_security_group_id" {
  description = "Security group ID for the Next.js web frontend"
  value       = aws_security_group.web.id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS PostgreSQL"
  value       = aws_security_group.rds.id
}

output "redis_security_group_id" {
  description = "Security group ID for ElastiCache Redis"
  value       = aws_security_group.redis.id
}
