# Flutter Client Authentication Guide

## Overview

This document explains how to implement authentication in your Flutter client for the Jober Backend API.

### Authentication System Summary

| Feature | Description |
|---------|-------------|
| **Token Type** | JWT Access Token |
| **Token Expiry** | 30 days |
| **Refresh Token** | Not used |
| **Role System** | Single role per user (`Job_finder` or `Recruiter`) |
| **Token Revocation** | Old tokens revoked on role switch or logout |

---

## Table of Contents

1. [Dependencies](#1-dependencies)
2. [Project Structure](#2-project-structure)
3. [API Endpoints](#3-api-endpoints)
4. [Authentication Flow](#4-authentication-flow)
5. [Implementation](#5-implementation)
6. [Error Handling](#6-error-handling)
7. [Complete Example](#7-complete-example)

---

## 1. Dependencies

Add these to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0
  flutter_secure_storage: ^9.0.0
  provider: ^6.1.1  # or riverpod/bloc for state management
```

---

## 2. Project Structure

```
lib/
├── main.dart
├── config/
│   └── api_config.dart
├── models/
│   ├── user.dart
│   └── auth_response.dart
├── services/
│   ├── auth_service.dart
│   ├── api_service.dart
│   └── storage_service.dart
├── providers/
│   └── auth_provider.dart
└── screens/
    ├── splash_screen.dart
    ├── login_screen.dart
    ├── otp_screen.dart
    ├── role_selection_screen.dart
    └── home_screen.dart
```

---

## 3. API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/sent-otp` | Send OTP to phone | No |
| POST | `/api/verify-otp` | Verify OTP and login | No |
| POST | `/api/select-role` | Select or switch role | Yes |
| POST | `/api/logout` | Logout and revoke token | Yes |

### Request/Response Examples

#### Send OTP
```http
POST /api/sent-otp
Content-Type: application/json

{
  "phone": "+855964319245"
}
```

Response:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 300
}
```

#### Verify OTP
```http
POST /api/verify-otp
Content-Type: application/json

{
  "phone": "+855964319245",
  "otp": "1234"
}
```

Response (New User - No Role):
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "user123",
    "phone": "+855964319245",
    "roles": []
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response (Returning User - Has Role):
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "user123",
    "phone": "+855964319245",
    "roles": ["Job_finder"]
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Select Role
```http
POST /api/select-role
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "role": "Recruiter"
}
```

Response (Role Changed):
```json
{
  "success": true,
  "message": "Role switched successfully. Please use the new token.",
  "user": {
    "id": "user123",
    "roles": ["Recruiter"]
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenUpdated": true
}
```

Response (Same Role):
```json
{
  "success": true,
  "message": "Role confirmed",
  "user": {
    "id": "user123",
    "roles": ["Recruiter"]
  },
  "tokenUpdated": false
}
```

#### Logout
```http
POST /api/logout
Authorization: Bearer <accessToken>
```

Response:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 4. Authentication Flow

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      APP STARTUP                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Check stored    │
                    │ access token    │
                    └─────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌─────────┐    ┌───────────┐   ┌─────────────┐
        │ No      │    │ Has token │   │ Has token   │
        │ token   │    │ no roles  │   │ with roles  │
        └─────────┘    └───────────┘   └─────────────┘
              │               │               │
              ▼               ▼               ▼
        ┌─────────┐    ┌───────────┐   ┌─────────────┐
        │ Login   │    │ Role      │   │ Home        │
        │ Screen  │    │ Selection │   │ Screen      │
        └─────────┘    └───────────┘   └─────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                      LOGIN FLOW                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Enter Phone │────>│ Enter OTP   │────>│ Check Roles │
│ (sent-otp)  │     │ (verify-otp)│     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                           ┌───────────────────┴───────────────────┐
                           │                                       │
                           ▼                                       ▼
                    ┌─────────────┐                         ┌─────────────┐
                    │ roles: []   │                         │ roles: [x]  │
                    │ NEW USER    │                         │ HAS ROLE    │
                    └─────────────┘                         └─────────────┘
                           │                                       │
                           ▼                                       │
                    ┌─────────────┐                                │
                    │ Select Role │                                │
                    │ Screen      │                                │
                    └─────────────┘                                │
                           │                                       │
                           ▼                                       │
                    ┌─────────────┐                                │
                    │ Call        │                                │
                    │ select-role │                                │
                    └─────────────┘                                │
                           │                                       │
                           ▼                                       ▼
                    ┌─────────────────────────────────────────────────┐
                    │              Save Token & Go Home               │
                    └─────────────────────────────────────────────────┘
```

### Key Rules

1. **Always check `roles` array after verify-otp**
   - Empty `[]` → Navigate to Role Selection
   - Has role `["Job_finder"]` → Navigate to Home

2. **Always check `tokenUpdated` after select-role**
   - `true` → Save the new `accessToken`
   - `false` → Keep using current token

3. **Handle 401 errors**
   - Token expired or revoked → Clear storage → Login screen

---

## 5. Implementation

### 5.1 API Configuration

```dart
// lib/config/api_config.dart

class ApiConfig {
  // Change this to your production URL
  static const String baseUrl = 'https://your-api-domain.com';
  
  // For local development
  // static const String baseUrl = 'http://localhost:3000';
  
  // Endpoints
  static const String sentOtp = '/api/sent-otp';
  static const String verifyOtp = '/api/verify-otp';
  static const String selectRole = '/api/select-role';
  static const String logout = '/api/logout';
  static const String profile = '/api/profile';
  static const String jobs = '/api/jobs';
  static const String company = '/api/company';
  static const String uploadSignature = '/api/upload/signature';
}
```

### 5.2 Models

```dart
// lib/models/user.dart

class User {
  final String id;
  final String? phone;
  final String? email;
  final List<String> roles;

  User({
    required this.id,
    this.phone,
    this.email,
    required this.roles,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      roles: List<String>.from(json['roles'] ?? []),
    );
  }

  bool get hasRole => roles.isNotEmpty;
  String? get currentRole => roles.isNotEmpty ? roles.first : null;
  bool get isJobFinder => roles.contains('Job_finder');
  bool get isRecruiter => roles.contains('Recruiter');
}
```

```dart
// lib/models/auth_response.dart

import 'user.dart';

class AuthResponse {
  final bool success;
  final String? message;
  final User? user;
  final String? accessToken;
  final bool? tokenUpdated;
  final String? error;

  AuthResponse({
    required this.success,
    this.message,
    this.user,
    this.accessToken,
    this.tokenUpdated,
    this.error,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      success: json['success'] ?? false,
      message: json['message'] as String?,
      user: json['user'] != null ? User.fromJson(json['user']) : null,
      accessToken: json['accessToken'] as String?,
      tokenUpdated: json['tokenUpdated'] as bool?,
      error: json['error'] as String?,
    );
  }

  factory AuthResponse.error(String errorMessage) {
    return AuthResponse(
      success: false,
      error: errorMessage,
    );
  }
}
```

### 5.3 Storage Service

```dart
// lib/services/storage_service.dart

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const _keyAccessToken = 'access_token';
  static const _keyUserId = 'user_id';
  static const _keyUserRole = 'user_role';

  // Access Token
  static Future<void> saveAccessToken(String token) async {
    await _storage.write(key: _keyAccessToken, value: token);
  }

  static Future<String?> getAccessToken() async {
    return await _storage.read(key: _keyAccessToken);
  }

  static Future<void> deleteAccessToken() async {
    await _storage.delete(key: _keyAccessToken);
  }

  // User ID
  static Future<void> saveUserId(String userId) async {
    await _storage.write(key: _keyUserId, value: userId);
  }

  static Future<String?> getUserId() async {
    return await _storage.read(key: _keyUserId);
  }

  // User Role
  static Future<void> saveUserRole(String role) async {
    await _storage.write(key: _keyUserRole, value: role);
  }

  static Future<String?> getUserRole() async {
    return await _storage.read(key: _keyUserRole);
  }

  // Clear all
  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
```

### 5.4 API Service

```dart
// lib/services/api_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'storage_service.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiService {
  static Future<Map<String, String>> _getHeaders({bool auth = false}) async {
    final headers = {
      'Content-Type': 'application/json',
    };

    if (auth) {
      final token = await StorageService.getAccessToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  static Future<Map<String, dynamic>> post(
    String endpoint, {
    Map<String, dynamic>? body,
    bool auth = false,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}$endpoint'),
        headers: await _getHeaders(auth: auth),
        body: body != null ? jsonEncode(body) : null,
      );

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 401) {
        // Token expired or invalid
        await StorageService.clearAll();
        throw ApiException('Session expired. Please login again.', statusCode: 401);
      }

      if (response.statusCode >= 400) {
        throw ApiException(
          data['error'] ?? 'Something went wrong',
          statusCode: response.statusCode,
        );
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: ${e.toString()}');
    }
  }

  static Future<Map<String, dynamic>> get(
    String endpoint, {
    bool auth = false,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}$endpoint'),
        headers: await _getHeaders(auth: auth),
      );

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 401) {
        await StorageService.clearAll();
        throw ApiException('Session expired. Please login again.', statusCode: 401);
      }

      if (response.statusCode >= 400) {
        throw ApiException(
          data['error'] ?? 'Something went wrong',
          statusCode: response.statusCode,
        );
      }

      return data;
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: ${e.toString()}');
    }
  }
}
```

### 5.5 Auth Service

```dart
// lib/services/auth_service.dart

import '../config/api_config.dart';
import '../models/auth_response.dart';
import '../models/user.dart';
import 'api_service.dart';
import 'storage_service.dart';

enum AuthStatus {
  unauthenticated,  // No token
  needsRole,        // Has token but no role
  authenticated,    // Has token with role
}

class AuthService {
  /// Check authentication status on app startup
  static Future<AuthStatus> checkAuthStatus() async {
    final token = await StorageService.getAccessToken();

    if (token == null) {
      return AuthStatus.unauthenticated;
    }

    // Verify token is still valid by calling a protected endpoint
    try {
      final data = await ApiService.get(ApiConfig.profile, auth: true);
      final roles = List<String>.from(data['user']?['roles'] ?? []);

      if (roles.isEmpty) {
        return AuthStatus.needsRole;
      }

      // Save role locally
      await StorageService.saveUserRole(roles.first);
      return AuthStatus.authenticated;
    } catch (e) {
      if (e is ApiException && e.statusCode == 401) {
        await StorageService.clearAll();
        return AuthStatus.unauthenticated;
      }
      // Network error - assume authenticated if we have a token
      return AuthStatus.authenticated;
    }
  }

  /// Send OTP to phone number
  static Future<AuthResponse> sendOtp(String phone) async {
    try {
      final data = await ApiService.post(
        ApiConfig.sentOtp,
        body: {'phone': phone},
      );

      return AuthResponse(
        success: data['success'] ?? true,
        message: data['message'],
      );
    } catch (e) {
      return AuthResponse.error(e.toString());
    }
  }

  /// Verify OTP and get access token
  static Future<AuthResponse> verifyOtp(String phone, String otp) async {
    try {
      final data = await ApiService.post(
        ApiConfig.verifyOtp,
        body: {'phone': phone, 'otp': otp},
      );

      final response = AuthResponse.fromJson(data);

      if (response.success && response.accessToken != null) {
        // Save token
        await StorageService.saveAccessToken(response.accessToken!);

        // Save user info
        if (response.user != null) {
          await StorageService.saveUserId(response.user!.id);
          if (response.user!.hasRole) {
            await StorageService.saveUserRole(response.user!.currentRole!);
          }
        }
      }

      return response;
    } catch (e) {
      return AuthResponse.error(e.toString());
    }
  }

  /// Select or switch user role
  static Future<AuthResponse> selectRole(String role) async {
    try {
      final data = await ApiService.post(
        ApiConfig.selectRole,
        body: {'role': role},
        auth: true,
      );

      final response = AuthResponse.fromJson(data);

      if (response.success) {
        // ⚠️ IMPORTANT: Check if new token was issued
        if (response.tokenUpdated == true && response.accessToken != null) {
          // Replace old token with new token
          await StorageService.saveAccessToken(response.accessToken!);
        }

        // Save the new role
        await StorageService.saveUserRole(role);
      }

      return response;
    } catch (e) {
      return AuthResponse.error(e.toString());
    }
  }

  /// Logout and revoke token
  static Future<void> logout() async {
    try {
      await ApiService.post(ApiConfig.logout, auth: true);
    } catch (e) {
      // Ignore errors - we'll clear local storage anyway
    } finally {
      await StorageService.clearAll();
    }
  }

  /// Get current user info
  static Future<User?> getCurrentUser() async {
    try {
      final data = await ApiService.get(ApiConfig.profile, auth: true);
      return User.fromJson(data['user']);
    } catch (e) {
      return null;
    }
  }
}
```

### 5.6 Auth Provider (State Management)

```dart
// lib/providers/auth_provider.dart

import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';

class AuthProvider extends ChangeNotifier {
  AuthStatus _status = AuthStatus.unauthenticated;
  User? _user;
  bool _isLoading = true;
  String? _error;

  AuthStatus get status => _status;
  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  bool get needsRole => _status == AuthStatus.needsRole;

  /// Initialize auth state on app startup
  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    _status = await AuthService.checkAuthStatus();

    if (_status == AuthStatus.authenticated) {
      _user = await AuthService.getCurrentUser();
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Send OTP
  Future<bool> sendOtp(String phone) async {
    _error = null;
    _isLoading = true;
    notifyListeners();

    final response = await AuthService.sendOtp(phone);

    _isLoading = false;
    if (!response.success) {
      _error = response.error ?? response.message;
    }
    notifyListeners();

    return response.success;
  }

  /// Verify OTP
  Future<bool> verifyOtp(String phone, String otp) async {
    _error = null;
    _isLoading = true;
    notifyListeners();

    final response = await AuthService.verifyOtp(phone, otp);

    _isLoading = false;

    if (response.success) {
      _user = response.user;

      if (_user?.hasRole == true) {
        _status = AuthStatus.authenticated;
      } else {
        _status = AuthStatus.needsRole;
      }
    } else {
      _error = response.error ?? response.message;
    }

    notifyListeners();
    return response.success;
  }

  /// Select role
  Future<bool> selectRole(String role) async {
    _error = null;
    _isLoading = true;
    notifyListeners();

    final response = await AuthService.selectRole(role);

    _isLoading = false;

    if (response.success) {
      _user = response.user ?? _user;
      _status = AuthStatus.authenticated;
    } else {
      _error = response.error ?? response.message;
    }

    notifyListeners();
    return response.success;
  }

  /// Logout
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    await AuthService.logout();

    _status = AuthStatus.unauthenticated;
    _user = null;
    _isLoading = false;
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
```

---

## 6. Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Continue |
| 400 | Bad Request | Show error message |
| 401 | Unauthorized | Clear token → Login screen |
| 403 | Forbidden | Show permission error |
| 404 | Not Found | Show error message |
| 429 | Too Many Requests | Show rate limit error |
| 500 | Server Error | Show generic error |

### Common Errors

```dart
// Handle 401 globally
if (response.statusCode == 401) {
  await StorageService.clearAll();
  // Navigate to login
  Navigator.of(context).pushNamedAndRemoveUntil('/login', (_) => false);
}
```

---

## 7. Complete Example

### Main App

```dart
// lib/main.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'screens/splash_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider()..initialize(),
      child: MaterialApp(
        title: 'Jober',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
          useMaterial3: true,
        ),
        home: const SplashScreen(),
      ),
    );
  }
}
```

### Splash Screen

```dart
// lib/screens/splash_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';
import 'role_selection_screen.dart';
import 'home_screen.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        if (auth.isLoading) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        // Navigate based on auth status
        switch (auth.status) {
          case AuthStatus.unauthenticated:
            return const LoginScreen();
          case AuthStatus.needsRole:
            return const RoleSelectionScreen();
          case AuthStatus.authenticated:
            return const HomeScreen();
        }
      },
    );
  }
}
```

### Login Screen

```dart
// lib/screens/login_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'otp_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthProvider>();
    final phone = '+855${_phoneController.text.trim()}';

    final success = await auth.sendOtp(phone);

    if (success && mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => OtpScreen(phone: phone),
        ),
      );
    } else if (auth.error != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error!)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  prefixText: '+855 ',
                  hintText: '964319245',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your phone number';
                  }
                  if (value.length < 8 || value.length > 9) {
                    return 'Phone number must be 8-9 digits';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              Consumer<AuthProvider>(
                builder: (context, auth, _) {
                  return SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: auth.isLoading ? null : _sendOtp,
                      child: auth.isLoading
                          ? const CircularProgressIndicator()
                          : const Text('Send OTP'),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### OTP Screen

```dart
// lib/screens/otp_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/auth_service.dart';
import 'role_selection_screen.dart';
import 'home_screen.dart';

class OtpScreen extends StatefulWidget {
  final String phone;

  const OtpScreen({super.key, required this.phone});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _otpController = TextEditingController();

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _verifyOtp() async {
    if (_otpController.text.length != 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter 4-digit OTP')),
      );
      return;
    }

    final auth = context.read<AuthProvider>();
    final success = await auth.verifyOtp(widget.phone, _otpController.text);

    if (success && mounted) {
      // Navigate based on whether user needs to select role
      if (auth.status == AuthStatus.needsRole) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const RoleSelectionScreen()),
          (_) => false,
        );
      } else {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const HomeScreen()),
          (_) => false,
        );
      }
    } else if (auth.error != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error!)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verify OTP')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Enter the OTP sent to ${widget.phone}'),
            const SizedBox(height: 24),
            TextField(
              controller: _otpController,
              keyboardType: TextInputType.number,
              maxLength: 4,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 24, letterSpacing: 8),
              decoration: const InputDecoration(
                hintText: '0000',
                counterText: '',
              ),
            ),
            const SizedBox(height: 24),
            Consumer<AuthProvider>(
              builder: (context, auth, _) {
                return SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: auth.isLoading ? null : _verifyOtp,
                    child: auth.isLoading
                        ? const CircularProgressIndicator()
                        : const Text('Verify'),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
```

### Role Selection Screen

```dart
// lib/screens/role_selection_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'home_screen.dart';

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  Future<void> _selectRole(BuildContext context, String role) async {
    final auth = context.read<AuthProvider>();
    final success = await auth.selectRole(role);

    if (success && context.mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const HomeScreen()),
        (_) => false,
      );
    } else if (auth.error != null && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error!)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Choose Your Role')),
      body: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'What do you want to do?',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 48),

                // Job Finder Option
                _RoleCard(
                  title: 'Find Jobs',
                  description: 'Browse and apply for jobs',
                  icon: Icons.search,
                  color: Colors.blue,
                  isLoading: auth.isLoading,
                  onTap: () => _selectRole(context, 'Job_finder'),
                ),

                const SizedBox(height: 16),

                // Recruiter Option
                _RoleCard(
                  title: 'Recruit Talent',
                  description: 'Post jobs and find candidates',
                  icon: Icons.business,
                  color: Colors.green,
                  isLoading: auth.isLoading,
                  onTap: () => _selectRole(context, 'Recruiter'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final Color color;
  final bool isLoading;
  final VoidCallback onTap;

  const _RoleCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
    required this.isLoading,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: isLoading ? null : onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 32),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      description,
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios),
            ],
          ),
        ),
      ),
    );
  }
}
```

### Home Screen

```dart
// lib/screens/home_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';
import 'role_selection_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        final user = auth.user;
        final role = user?.currentRole ?? 'Unknown';

        return Scaffold(
          appBar: AppBar(
            title: Text('Welcome, $role'),
            actions: [
              // Role Switch Button
              IconButton(
                icon: const Icon(Icons.swap_horiz),
                tooltip: 'Switch Role',
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const RoleSelectionScreen(),
                    ),
                  );
                },
              ),
              // Logout Button
              IconButton(
                icon: const Icon(Icons.logout),
                onPressed: () async {
                  await auth.logout();
                  if (context.mounted) {
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (_) => false,
                    );
                  }
                },
              ),
            ],
          ),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  user?.isRecruiter == true ? Icons.business : Icons.person,
                  size: 100,
                  color: Colors.blue,
                ),
                const SizedBox(height: 24),
                Text(
                  'Logged in as ${user?.phone ?? "Unknown"}',
                  style: const TextStyle(fontSize: 18),
                ),
                const SizedBox(height: 8),
                Chip(
                  label: Text(role),
                  backgroundColor: user?.isRecruiter == true
                      ? Colors.green[100]
                      : Colors.blue[100],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
```

---

## Quick Reference

### Token Management Checklist

- [ ] Save token after `verify-otp`
- [ ] Check `roles` array after `verify-otp`
- [ ] Check `tokenUpdated` after `select-role`
- [ ] Replace token if `tokenUpdated: true`
- [ ] Clear token on 401 response
- [ ] Clear token on logout

### Navigation Rules

```dart
// After verify-otp
if (roles.isEmpty) {
  // → Role Selection Screen
} else {
  // → Home Screen
}

// After select-role
// → Home Screen

// On 401 error
// → Login Screen

// On logout
// → Login Screen
```

---

## Support

If you have questions about this implementation, refer to:
- API source code in `src/app/api/`
- JWT implementation in `src/lib/jwt.ts`
- Auth utilities in `src/lib/auth.ts`
