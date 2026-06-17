terraform {
  backend "s3" {
    bucket         = "eduai-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "eduai-terraform-locks"
  }
}
