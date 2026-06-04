{{/*
Expand the name of the chart.
*/}}
{{- define "eduai.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "eduai.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "eduai.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels applied to all resources.
*/}}
{{- define "eduai.labels" -}}
helm.sh/chart: {{ include "eduai.chart" . }}
{{ include "eduai.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels.
*/}}
{{- define "eduai.selectorLabels" -}}
app.kubernetes.io/name: {{ include "eduai.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
API component labels.
*/}}
{{- define "eduai.api.labels" -}}
{{ include "eduai.labels" . }}
app.kubernetes.io/component: api
{{- end }}

{{/*
API selector labels.
*/}}
{{- define "eduai.api.selectorLabels" -}}
{{ include "eduai.selectorLabels" . }}
app.kubernetes.io/component: api
{{- end }}

{{/*
Web component labels.
*/}}
{{- define "eduai.web.labels" -}}
{{ include "eduai.labels" . }}
app.kubernetes.io/component: web
{{- end }}

{{/*
Web selector labels.
*/}}
{{- define "eduai.web.selectorLabels" -}}
{{ include "eduai.selectorLabels" . }}
app.kubernetes.io/component: web
{{- end }}

{{/*
Worker component labels.
*/}}
{{- define "eduai.worker.labels" -}}
{{ include "eduai.labels" . }}
app.kubernetes.io/component: worker
{{- end }}

{{/*
Worker selector labels.
*/}}
{{- define "eduai.worker.selectorLabels" -}}
{{ include "eduai.selectorLabels" . }}
app.kubernetes.io/component: worker
{{- end }}

{{/*
Create the name of the service account to use.
*/}}
{{- define "eduai.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "eduai.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Return the proper image name.
Usage: {{ include "eduai.image" (dict "image" .Values.api.image "global" .Values.global) }}
*/}}
{{- define "eduai.image" -}}
{{- $registryName := .image.registry | default .global.imageRegistry -}}
{{- $repositoryName := .image.repository -}}
{{- $tag := .image.tag | default "latest" | toString -}}
{{- if $registryName -}}
  {{- printf "%s/%s:%s" $registryName $repositoryName $tag -}}
{{- else -}}
  {{- printf "%s:%s" $repositoryName $tag -}}
{{- end }}
{{- end }}

{{/*
Render environment variables from a dict.
*/}}
{{- define "eduai.envVars" -}}
{{- range $key, $value := . }}
- name: {{ $key }}
  value: {{ $value | quote }}
{{- end }}
{{- end }}
