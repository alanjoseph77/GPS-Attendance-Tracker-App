
# GPS Attendance App - Backend Integration Notes (Django REST)

This mobile app is designed to be easily connected to a Django REST Framework (DRF) backend.

### 1. Typical API Endpoints needed:
- `POST /api/auth/login/` -> Returns JWT token.
- `POST /api/attendance/session/` -> Syncs a completed session.
- `GET /api/attendance/history/` -> Retrieves user session history.

### 2. Payload Structure for Syncing:
When a geofence exit event occurs and a session is closed, you can sync the following structure:

```json
{
  "id": "1706692200000",
  "enter_time": "2026-01-30T10:00:00Z",
  "exit_time": "2026-01-30T18:00:00Z",
  "duration_seconds": 28800,
  "lat": 12.9716,
  "lng": 77.5946
}
```

### 3. Implementation Steps:
1.  **Update StorageService**: Add a `syncToBackend` method that iterates through local sessions and sends them to the server.
2.  **Add Auth Context**: Store the JWT token in `AsyncStorage` and include it in the `Authorization` header of all requests.
3.  **Background Sync**: Use `BackgroundFetch` or trigger sync during `onRefresh` in the mobile app.

### 4. Sample DRF Serializer:
```python
from rest_framework import serializers
from .models import AttendanceSession

class AttendanceSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceSession
        fields = ['id', 'enter_time', 'exit_time', 'duration_seconds', 'lat', 'lng']
```
