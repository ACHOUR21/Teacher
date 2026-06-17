locals {
  s3_origin_id = "EduAIS3Origin"
}

# ─────────────────────────────────────────────
# Cache Policies
# ─────────────────────────────────────────────
resource "aws_cloudfront_cache_policy" "assets" {
  name        = "EduAI-Assets-Cache-Policy"
  comment     = "Cache policy for EduAI static assets — 1 year TTL"
  default_ttl = 31536000  # 1 year
  max_ttl     = 31536000
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "whitelist"
      query_strings {
        items = ["v", "version"]
      }
    }
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true
  }
}

resource "aws_cloudfront_cache_policy" "media" {
  name        = "EduAI-Media-Cache-Policy"
  comment     = "Cache policy for EduAI media files — 7 days TTL"
  default_ttl = 604800  # 7 days
  max_ttl     = 2592000 # 30 days
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true
  }
}

# ─────────────────────────────────────────────
# Response Headers Policy
# ─────────────────────────────────────────────
resource "aws_cloudfront_response_headers_policy" "security" {
  name    = "EduAI-Security-Headers"
  comment = "Security response headers for EduAI CloudFront distribution"

  security_headers_config {
    content_security_policy {
      content_security_policy = "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
      override                = false
    }
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "SAMEORIGIN"
      override     = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
  }

  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      value    = "camera=(), microphone=(), geolocation=()"
      override = true
    }
  }
}

# ─────────────────────────────────────────────
# CloudFront Distribution
# ─────────────────────────────────────────────
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "EduAI assets CDN — ${var.environment}"
  default_root_object = "index.html"
  price_class         = var.price_class
  aliases             = var.domain_aliases
  web_acl_id          = var.waf_web_acl_id

  origin {
    domain_name = var.s3_bucket_regional_domain
    origin_id   = local.s3_origin_id

    s3_origin_config {
      origin_access_identity = var.origin_access_identity
    }
  }

  # Default cache behavior: static assets
  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = local.s3_origin_id
    cache_policy_id            = aws_cloudfront_cache_policy.assets.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
  }

  # /videos/* — longer TTL, no compression (already compressed)
  ordered_cache_behavior {
    path_pattern               = "/videos/*"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = local.s3_origin_id
    cache_policy_id            = aws_cloudfront_cache_policy.media.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = false
  }

  # /uploads/* — same as media
  ordered_cache_behavior {
    path_pattern               = "/uploads/*"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = local.s3_origin_id
    cache_policy_id            = aws_cloudfront_cache_policy.media.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = false
  }

  # Error responses: serve from S3 with long TTL
  custom_error_response {
    error_code            = 403
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 300
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 300
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  logging_config {
    include_cookies = false
    bucket          = "${var.s3_bucket_id}.s3.amazonaws.com"
    prefix          = "cloudfront-logs/"
  }

  tags = {
    Name        = "eduai-cdn-${var.environment}"
    Environment = var.environment
  }
}
