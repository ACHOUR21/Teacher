resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "db_password" {
  name                    = "/${var.environment}/eduai/db-password"
  description             = "RDS PostgreSQL master password for EduAI"
  recovery_window_in_days = 7

  tags = {
    Name        = "${var.identifier}-db-password"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    dbname   = var.db_name
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
  })
}

# ─────────────────────────────────────────────
# DB Subnet Group
# ─────────────────────────────────────────────
resource "aws_db_subnet_group" "main" {
  name        = "${var.identifier}-subnet-group"
  description = "Subnet group for ${var.identifier} RDS instance"
  subnet_ids  = var.subnet_ids

  tags = {
    Name        = "${var.identifier}-subnet-group"
    Environment = var.environment
  }
}

# ─────────────────────────────────────────────
# Security Group
# ─────────────────────────────────────────────
resource "aws_security_group" "rds" {
  name        = "${var.identifier}-rds-sg"
  description = "Security group for ${var.identifier} RDS instance"
  vpc_id      = var.vpc_id

  ingress {
    description = "PostgreSQL from private subnets"
    from_port   = 5432
    to_port     = 5432
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
    Name        = "${var.identifier}-rds-sg"
    Environment = var.environment
  }
}

# ─────────────────────────────────────────────
# KMS Key for encryption at rest
# ─────────────────────────────────────────────
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption — ${var.identifier}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "${var.identifier}-rds-kms"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.identifier}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# ─────────────────────────────────────────────
# DB Parameter Group
# ─────────────────────────────────────────────
resource "aws_db_parameter_group" "main" {
  name        = "${var.identifier}-params"
  family      = "postgres16"
  description = "Custom parameter group for ${var.identifier}"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_lock_waits"
    value = "1"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "pg_stat_statements.track"
    value = "all"
  }

  parameter {
    name         = "max_connections"
    value        = "200"
    apply_method = "pending-reboot"
  }

  tags = {
    Name        = "${var.identifier}-params"
    Environment = var.environment
  }
}

# ─────────────────────────────────────────────
# RDS Instance — PostgreSQL 16, Multi-AZ
# ─────────────────────────────────────────────
resource "aws_db_instance" "main" {
  identifier = var.identifier

  # Engine
  engine               = "postgres"
  engine_version       = var.engine_version
  instance_class       = var.instance_class
  parameter_group_name = aws_db_parameter_group.main.name

  # Storage
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  # Credentials
  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # High availability
  multi_az = var.multi_az

  # Backup
  backup_retention_period   = var.backup_retention_period
  backup_window             = "03:00-04:00"
  maintenance_window        = "Mon:04:00-Mon:05:00"
  copy_tags_to_snapshot     = true
  delete_automated_backups  = false
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.identifier}-final-snapshot"

  # Monitoring
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_enhanced_monitoring.arn
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  # Auto minor version upgrade
  auto_minor_version_upgrade = true

  # Deletion protection — set to false only when decommissioning
  deletion_protection = var.deletion_protection

  tags = {
    Name        = var.identifier
    Environment = var.environment
  }
}

# ─────────────────────────────────────────────
# Enhanced Monitoring Role
# ─────────────────────────────────────────────
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.identifier}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "monitoring.rds.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ─────────────────────────────────────────────
# CloudWatch Alarm — CPU
# ─────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.identifier}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization exceeds 80%"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_free_storage" {
  alarm_name          = "${var.identifier}-low-free-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 10737418240  # 10 GB in bytes
  alarm_description   = "RDS free storage space is below 10 GB"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = {
    Environment = var.environment
  }
}
