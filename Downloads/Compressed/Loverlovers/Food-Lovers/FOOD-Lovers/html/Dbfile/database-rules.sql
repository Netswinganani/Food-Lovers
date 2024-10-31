{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    
    "products": {
      ".indexOn": ["status", "cate"]
    },
    
    "Users": {
      ".indexOn": ["email"],
      "$uid": {
        ".validate": "auth != null && ($uid === auth.uid || auth.token.isAdmin === true)",
        ".read": "auth != null && ($uid === auth.uid || auth.token.isAdmin === true)"
      }
    },

  "Admins": {
      ".indexOn": ["email"],
      "$uid": {
        ".validate": "auth != null",
        ".read": "auth != null", // Allow all authenticated users to read Admins
        ".write": "auth != null && auth.token.isAdmin === true" // Allow only admins to write
      }
    },
    "payment-history": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
