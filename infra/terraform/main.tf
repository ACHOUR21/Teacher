terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_ca_certificate)
  token                  = module.eks.cluster_auth_token
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_ca_certificate)
    token                  = module.eks.cluster_auth_token
  }
}

# ─────────────────────────────────────────────
# VPC
# ─────────────────────────────────────────────
module "vpc" {
  source = "./modules/vpc"

  project_name         = var.project_name
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  private_subnet_cidrs = var.private_subnet_cidrs
  public_subnet_cidrs  = var.public_subnet_cidrs
  cluster_name         = var.cluster_name
}

# ─────────────────────────────────────────────
# EKS
# ─────────────────────────────────────────────
module "eks" {
  source = "./modules/eks"

  cluster_name       = var.cluster_name
  kubernetes_version = var.kubernetes_version
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  desired_capacity   = var.desired_capacity
  min_size           = var.min_size
  max_size           = var.max_size
  instance_types     = var.instance_types
  environment        = var.environment
}

# ─────────────────────────────────────────────
# Security Groups
# Depends on EKS for the node security group ID.
# ─────────────────────────────────────────────
module "security" {
  source = "./modules/security"

  project_name   = var.project_name
  environment    = var.environment
  vpc_id         = module.vpc.vpc_id
  eks_node_sg_id = module.eks.node_security_group_id
}

# ─────────────────────────────────────────────
# RDS
# ─────────────────────────────────────────────
module "rds" {
  source = "./modules/rds"

  identifier              = "${var.cluster_name}-postgres"
  instance_class          = var.db_instance_class
  engine_version          = var.db_engine_version
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnet_ids
  allowed_cidr_blocks     = module.vpc.private_subnet_cidrs
  environment             = var.environment
  db_name                 = var.db_name
  db_username             = var.db_username
  multi_az                = var.db_multi_az
  backup_retention_period = var.db_backup_retention_days
}

# ─────────────────────────────────────────────
# ElastiCache
# ─────────────────────────────────────────────
module "elasticache" {
  source = "./modules/elasticache"

  cluster_id          = "${var.cluster_name}-redis"
  node_type           = var.redis_node_type
  engine_version      = var.redis_engine_version
  num_cache_nodes     = var.redis_num_cache_nodes
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  allowed_cidr_blocks = module.vpc.private_subnet_cidrs
  environment         = var.environment
}

# ─────────────────────────────────────────────
# S3
# ─────────────────────────────────────────────
module "s3" {
  source = "./modules/s3"

  bucket_name = "${var.project_name}-assets-${var.environment}"
  environment = var.environment
}

# ─────────────────────────────────────────────
# CloudFront
# ─────────────────────────────────────────────
module "cloudfront" {
  source = "./modules/cloudfront"

  s3_bucket_regional_domain = module.s3.bucket_regional_domain_name
  s3_bucket_id              = module.s3.bucket_id
  origin_access_identity    = module.s3.origin_access_identity_iam_arn
  environment               = var.environment
  price_class               = var.cloudfront_price_class
}
