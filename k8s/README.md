# Gurukool Kubernetes Manifests

These manifests package the Phase 7 production deployment path:

- `namespace.yaml` creates the `gurukool` namespace.
- `configmap.yaml` stores non-secret runtime configuration.
- `secrets.example.yaml` shows the secret names the backend expects.
- `backend-deployment.yaml` runs the Express API with health probes.
- `frontend-deployment.yaml` runs the Ionic PWA behind Nginx.
- `hpa.yaml` enables horizontal autoscaling.
- `ingress.yaml` routes `app.gurukool.app` and `api.gurukool.app`.

Apply in order after replacing secrets and pushing container images:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml
```
