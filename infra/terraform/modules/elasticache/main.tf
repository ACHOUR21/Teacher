resource "random_password" "redis_auth_token" {
  length  = 32
  special = false  # Redis AUTH token cannot contain special chars
}

resource "aws_secretsmanager_secret" "redis_auth_token" {
  name                    = "/${var.environment}/eduai/redis-auth-token"
  description             = "ElastiCache Redis AUTH token for EduAI"
  recovery_window_in_days = 7

  tags = {
    Name        = "${var.cluster_id}-redis-auth-token"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "redis_auth_token" {
  secret_id     = aws_secretsmanager_secret.redis_auth_token.id
  secret_string = random_password.redis_auth_token.result
}

# ─────────────────────────────────────────────
# Subnet Group
# ─────────────────────────────────────────────
resource "aws_elasticache_subnet_group" "main" {
  name        = "${var.cluster_id}-subnet-group"
  description = "Subnet group for ${var.cluster_id} ElastiCache Redis cluster"
  subnet_ids  = var.subnet_ids

  tags = {
    Name        = "${var.cluster_id}-subnet-group"
    Environment = var.environment
  }
}

# ─────────────────────────────────────────────
# Security Group
# ─────────────────────────────────────────────
resource "aws_security_group" "redis" {
  name        = "${var.cluster_id}-redis-sg"
  description = "Security group for ${var.cluster_id} ElastiCache Redis"
  vpc_id      = var.vpc_id

  ingress {
    description = "Redis from private subnets"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.cluster_id}-redis-sg"
    Environment = var.environment
  }
}

# ─────────────────────────────────────────────
# Parameter Group
# ─────────────────────────────────────────────
resource "aws_elasticache_parameter_group" "main" {
  name        = "${var.cluster_id}-params"
  family      = "redis7"
  description = "Custom parameter group for ${var.cluster_id}"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "activerehashing"
    value = "yes"
  }

  parameter {
    name  = "lazyfree-lazy-eviction"
    value = "yes"
  }

  parameter {
    name  = "lazyfree-lazy-expire"
    value = "yes"
  }

  tags = {
    Name        = "${var.cluster_id}-params"
    Environment = var.environment
  }
}

# ─────────────────────────────────────────────
# ElastiCache Replication Group (Redis 7, cluster mode off)
# ─────────────────────────────────────────────
resource "aws_elasticache_replication_group" "main" {
  replication_group_id = var.cluster_id
  description          = "EduAI Redis replication group — ${var.environment}"

  # Engine
  engine               = "redis"
  engine_version       = var.engine_version
  node_type            = var.node_type
  parameter_group_name = aws_elasticache_parameter_group.main.name
  port                 = 6379

  # Topology: 1 primary + 1 replica per AZ for automatic failover
  num_cache_clusters         = var.num_cache_nodes
  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled           = var.multi_az_enabled

  # Network
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  # Security
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth_token.result

  # Maintenance
  maintenance_window       = "sun:05:00-sun:06:00"
  snapshot_window          = "04:00-05:00"
  snapshot_retention_limit = 7

  # Notifications
  notification_topic_arn = var.notification_topic_arn

  # Apply changes immediately in production
  apply_immediately = false

  tags = {
    Name        = var.cluster_id
    Environment = var.environment
  }

  lifecycle {
    ignore_changes = [auth_token]
  }
}

# ─────────────────────────────────────────────
# CloudWatch Alarms
# ─────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "${var.cluster_id}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ElastiCache Redis CPU utilization exceeds 80%"
  alarm_actions       = var.alarm_actions

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.main.id
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "${var.cluster_id}-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ElastiCache Redis memory usage exceeds 85%"
  alarm_actions       = var.alarm_actions

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.main.id
  }

  tags = {
    Environment = var.environment
  }
}
