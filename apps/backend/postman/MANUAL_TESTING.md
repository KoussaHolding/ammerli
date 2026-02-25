# Manual Testing Guide: Ammerli API with Postman

This guide details how to manually test the full "Ride Lifecycle" using the updated Postman collection.

## 🚀 Setup

1.  **Import Collection**: Import `ammerli_api.postman_collection.json` into Postman.
2.  **Environment Variables**: The collection uses the following variables (automatically updated by scripts):
    *   `baseUrl`: `http://localhost:3000/api/v1` (Default)
    *   `accessToken`: Auth token for requests.
    *   `requestId`: The ID of the currently active request.

## 🧪 Testing Flow: Ride Lifecycle

Follow these steps in order to simulate a complete ride/delivery flow.

### Phase 1: Authentication & Request Creation

1.  **Register/Login (Client)**
    *   Go to **Auth > Register (Phone)** or **Login (Phone)**.
    *   Click **Send**.
    *   *Result*: Status `200/201`. The `accessToken` variable is automatically set.

2.  **Create Request**
    *   Go to **Request > Create Request**.
    *   Body (Example):
        ```json
        {
            "pickupLat": 36.7525,
            "pickupLng": 3.042,
            "quantity": 5,
            "type": "INDIVIDUAL",
            "note": "Manual Test Request"
        }
        ```
    *   Click **Send**.
    *   *Result*: Status `201 Created`. The `requestId` variable is automatically set from the response.

### Phase 2: Driver Actions (Dispatch)

*Note: In a real scenario, a separate Driver account would do this. For manual testing, you can often use the same token if RBAC allows, or switch to a Driver account.*

3.  **Accept Request**
    *   Go to **Dispatch > Accept Request**.
    *   Body: `{"requestId": "{{requestId}}"}` (Pre-filled via variable).
    *   Click **Send**.
    *   *Result*: Status `200 OK`. The request is now assigned to the driver.

4.  **Driver Arrived**
    *   Go to **Request > Driver Arrived**.
    *   URL: `.../requests/{{requestId}}/arrived`.
    *   Click **Send**.
    *   *Result*: Status `200 OK`. Request status updates to `ARRIVED`.

5.  **Start Ride**
    *   Go to **Request > Start Ride**.
    *   URL: `.../requests/{{requestId}}/start`.
    *   Click **Send**.
    *   *Result*: Status `200 OK`. Request status updates to `IN_PROGRESS`.

6.  **Complete Request**
    *   Go to **Request > Complete Request**.
    *   URL: `.../requests/{{requestId}}/complete`.
    *   Click **Send**.
    *   *Result*: Status `200 OK`. Request status updates to `COMPLETED`.

### Optional: Cancellation

*   **Cancel Request**
    *   Can be called instead of steps 3-6 if you want to test the cancellation flow.
    *   Go to **Request > Cancel Request**.
    *   URL: `.../requests/{{requestId}}/cancel`.

## 🔍 Verification

*   Use **Request > Get Active Request** at any point to check the current status of the request.
*   Check your server logs to ensure no 500 errors occur during these transitions.
