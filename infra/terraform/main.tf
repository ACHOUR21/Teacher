terraform {
  required_version = ">= 1.7.0"

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

  backend "s3" {
    bucket         = "eduai-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "eduai-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "eduai-ultimate"
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
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.cluster_name}-vpc"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  enable_nat_gateway     = true
  single_nat_gateway     = false
  one_nat_gateway_per_az = true
  enable_dns_hostnames   = true
  enable_dns_support     = true

  # EKS requires specific tags on subnets
  private_subnet_tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"           = "1"
  }

  public_subnet_tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                    = "1"
  }
}

# ─────────────────────────────────────────────
# EKS
# ─────────────────────────────────────────────
module "eks" {
  source = "./modules/eks"

  cluster_name       = var.cluster_name
  kubernetes_version = var.kubernetes_version
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnets
  desired_capacity   = var.desired_capacity
  min_size           = var.min_size
  max_size           = var.max_size
  instance_types     = var.instance_types
  environment        = var.environment
}

# ─────────────────────────────────────────────
# RDS
# ─────────────────────────────────────────────
module "rds" {
  source = "./modules/rds"

  identifier         = "${var.cluster_name}-postgres"
  instance_class     = var.db_instance_class
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnets
  allowed_cidr_blocks = module.vpc.private_subnets_cidr_blocks
  environment        = var.environment
}

# ─────────────────────────────────────────────
# ElastiCache
# ─────────────────────────────────────────────
module "elasticache" {
  source = "./modules/elasticache"

  cluster_id          = "${var.cluster_name}-redis"
  node_type           = var.redis_node_type
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnets
  allowed_cidr_blocks = module.vpc.private_subnets_cidr_blocks
  environment         = var.environment
}

# ─────────────────────────────────────────────
# S3
# ─────────────────────────────────────────────
module "s3" {
  source = "./modules/s3"

  bucket_name = "${var.cluster_name}-assets-${var.environment}"
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
}
