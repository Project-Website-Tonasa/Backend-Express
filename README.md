
# Tonasa Backend API

## Get Started
- Clone repository with command `git clone <alamat_repo>`
- Move to directory backend-express `backend-express`
- Install dependencies using command `npm install`
- Create an .env file. filename is .env. 
  Make sure that .env has content like this:

  ```
  # node-postgres configuration (prod)
  PGHOST=
  PGDATABASE=
  PGPORT=
  PGUSER=
  PGPASSWORD=
  PORT=
 
  ```

- migrate to the db `npm run migrate up`
- Running the server `npm run dev`

### Generate JWT Token
- Access & Refresh Token
  - In terminal/cmd type node then enter
  - Type this code to generate token
  - Copy the output and paste to the .env->SECRET

## API

### Authentication User
- Login
    - method: `POST`
    - endpoint :`/login`
    - body request:
    ```json
    {
        "username": string | required, 
        "password": string | required
    }
    ```
    - body response:
    ```json
    {
      "status": "success",
      "message": "Login Success",
      "userData": {
          "id": 2,
          "username": "brillianita",
          "role": "kontraktor"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoyLCJpYXQiOjE2NzUyNTE3ODAsImV4cCI6MTY3NTI1MTkwMH0.mYRrKKq708XRu-O0lxGive0efAoyanut9Dn2mXkdi0Q",
      "refreshToken": "3f3018ab-df98-4828-b83e-562a8f794e3a"
    }
    ```
 
- Update Access Token
  - method: `PUT`,
  - endpoint: `/refreshToken`
  - body request:
    ```json
    {
        "refreshToken": token|required
    }
    ```
  - body response:
  ```json
  {
      "status": "success",
      "message": "Token updated!",
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "dd1921e..."
  }
  ```
 
 - Logout
    - method: `DELETE`
    - endpoint :`/logout`
    - body request:
    ```json
    {
        "refreshToken": token | required
    }
    ```
    - body response:
    ```json
    {
        "message": "Authentications has been removed"
    }
    ```

### Accessing Kontraktor
- Get Recap
    - method: `GET`
    - endpoint: `/kontraktor`
    - authorization: 
      - type: `Bearer Token`,
      - token: `accessToken`
    - body response:
    ```json
    {
        "status": "success",
        "data": [{
            "id": 6,
            "jenis_pekerjaan": "electrical",
            "nama_pekerjaan": "tetsts",
            "nomor_kontrak": "9845985",
            "kont_pelaksana": "hhjdd",
            "lokasi_pekerjaan": "makassar"
        },...
        ]
    }
    ```
  ---- **_Pagination_** ----     
     - endpoint: `/kontraktor?pageSize=10&currentPage=1`  
      will show 10 first kontraktors.  
      `pageSize` stand for how many kontraktor that can be shown in one page.  
      `currentPage` stand for kontraktor current page. 
     - body response:
     ```json
      {
          "status": "success",
          "data": [
              {
                "id": 6,
                "jenis_pekerjaan": "electrical",
                "nama_pekerjaan": "tetsts",
                "nomor_kontrak": "9845985",
                "kont_pelaksana": "hhjdd",
                "lokasi_pekerjaan": "makassar"
              },...
          ],
              "page": {
              "pageSize": "2",
              "total_rows": "19",
              "total_pages": 10,
              "currentPage": "1"
          }
      }
    ```  
  ---- **_Search_** ----    
  - endpoint: `/kontraktor?search=brillianita`  
  will filter the kontraktors and only show the kontraktor within `search` Brillianita 

- Get kontraktor By Id kontraktor
  - method: `GET`
  - endpoint: `/kontraktor/:id`,
  - authorization: 
    - type: `Bearer Token`,
    - token: `accessToken`
  - body response: 
  ```json
  {
      "status": "success",
      "data`": [
          {
            "id": 6,
            "jenis_pekerjaan": "electrical",
            "nama_pekerjaan": "tetsts",
            "nomor_kontrak": "9845985",
            "kont_pelaksana": "hhjdd",
            "lokasi_pekerjaan": "makassar"
          }
      ]
  }
  ```
- Insert New Kontraktor
  - - method: `POST`
  - endpoint: `/kontraktor/tambah`,
  - Authorization:
    - type: `Bearer Token`,
    - token: `accessToken`
  - body request:
  ```json
    {
        "jenisPekerjaan": string | required,
        "namaPekerjaan": string | required,
        "nomorKontrak": string | required,
        "lokasiPekerjaan": string | required,
        "kontPelaksana": string | required, 
        "username": string | required,
        "password": string | required,
        "confirmPassword": string | required
    }
  ```
  - body response: 
  ```json
  {
    "Register successfull!"
  }
  ````  


  ### Accessing Admin
- Get Recap
    - method: `GET`
    - endpoint: `/admin`
    - authorization: 
      - type: `Bearer Token`,
      - token: `accessToken`
    - body response:
    ```json
    {
        "status": "success",
        "data": [{
            "id": 2,
            "nama": "ditaa",
            "sap": "873538959",
            "seksi": "pengadaan"
        },...
        ]
    }
    ```
  ---- **_Pagination_** ----     
     - endpoint: `/admin?pageSize=10&currentPage=1`  
      will show 10 first admin.  
      `pageSize` stand for how many admin that can be shown in one page.  
      `currentPage` stand for admin current page. 
     - body response:
     ```json
      {
          "status": "success",
          "data": [
              {
                "id": 2,
            "nama": "ditaa",
            "sap": "873538959",
            "seksi": "pengadaan"
              },...
          ],
              "page": {
              "pageSize": "2",
              "total_rows": "19",
              "total_pages": 10,
              "currentPage": "1"
          }
      }
    ```
  ---- **_Search_** ----    
  - endpoint: `/admin?search=brillianita`  
  will filter the admin and only show the admin within `search` Brillianita 

- Get Admin By Id admin
  - method: `GET`
  - endpoint: `/admin/:id`,
  - authorization: 
    - type: `Bearer Token`,
    - token: `accessToken`
  - body response: 
  ```json
    {
        "status": "success",
        "data": [
            {
                "id": 2,
                "nama": "ditaa",
                "sap": "873538959",
                "seksi": "pengadaan"
            }
        ]
    }
  ```
- Insert New admin
  - - method: `POST`
  - endpoint: `/admin/tambah`,
  - Authorization:
    - type: `Bearer Token`,
    - token: `accessToken`
  - body request:
  ```json
    {
        "nama": string | required,
        "sap": string | required,
        "seksi": string | required,
        "username": string | required,
        "password": string | required,
        "confirmPassword": string | required
    }
  ```
  - body response: 
  ```json
  {
    "Register successfull!"
  }
  ````  