resource "aws_s3_bucket_lifecycle_configuration" "eduai_backups" {
  bucket = var.s3_bucket_name

  rule {
    id     = "backup-retention-daily"
    status = "Enabled"

    filter {
      prefix = "backups/postgres/"
    }

    expiration {
      days = 30
    }
  }

  rule {
    id     = "backup-retention-weekly"
    status = "Enabled"

    filter {
      prefix = "backups/postgres/weekly/"
    }

    expiration {
      days = 90
    }
  }

  rule {
    id     = "backup-retention-redis"
    status = "Enabled"

    filter {
      prefix = "backups/redis/"
    }

    expiration {
      days = 7
    }
  }

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {
      prefix = "backups/"
    }

    transition {
      days          = 30
      storage_class = "GLACIER_IR"
    }
  }
}

resource "aws_s3_bucket_versioning" "eduai_backups" {
  bucket = var.s3_bucket_name

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_replication_configuration" "eduai_backups" {
  count  = var.enable_cross_region_replication ? 1 : 0
  bucket = var.s3_bucket_name
  role   = aws_iam_role.replication[0].arn

  rule {
    id     = "backup-replication"
    status = "Enabled"

    filter {
      prefix = "backups/"
    }

    destination {
      bucket        = var.s3_replica_bucket_arn
      storage_class = "STANDARD_IA"
    }
  }
}
