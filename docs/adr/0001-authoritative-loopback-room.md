# Keep the room authoritative and local

The room lives in one Node process, and controllers receive role-specific projections. Shipping a complete question bank to clients would expose truth and private answers before voting, so server modules are never served. This trades offline static hosting for an authoritative multiplayer room. The server binds only to 127.0.0.1; this project does not change network security settings or provide public phone access.
