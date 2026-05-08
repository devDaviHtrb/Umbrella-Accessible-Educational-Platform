# 🌍 Umbrella

> **Education for everyone, without barriers.**

Umbrella is a modern educational platform built to promote inclusion, accessibility, and personalized learning for people with sensory, motor, and neurodivergent disabilities.

Designed with a mobile-first approach, Umbrella combines powerful accessibility tools, online learning resources, and AI-driven assistance into one seamless experience.

---

## ✨ Why Umbrella?

Many educational systems still overlook students with different physical, sensory, or cognitive needs. Umbrella was created to change that.

Our mission is to make learning more adaptable, more human, and more accessible for everyone.

---

## 🚀 Features

### 🎓 Smart Learning Environment
- Online live classes
- Recorded lessons for replay anytime
- Course dashboard
- Study calendar and reminders

### ♿ Accessibility First
- High contrast mode
- Focus mode
- Customizable fonts and interface sizes
- Speech-to-text support
- Sign language integration *(planned)*

### 🤖 AI Assistance
- Personalized study plans
- Learning support based on user needs
- Smart recommendations

### 💬 Communication Tools
- Public and private class channels
- Teacher ↔ Student direct communication
- Live chat during classes

### 🛠 Productivity Tools
- Digital whiteboard
- Screen sharing
- File sharing

---

## 🧱 Tech Stack

- 📱 React Native
- 🐍 Python Flask
- ☕ Java Spring
- ⚡ WebSockets
- 🔗 gRPC
- 🐳 Docker
- 🗄 Databases
- 🤖 AI APIs

---

## 🛠️ Data Access Layer (Spring Data JPA)

Within the Umbrella backend, we leverage **Spring Data JPA** to handle data persistence efficiently. By extending the `JpaRepository` interface, our services gain access to a standardized set of methods for managing entities without boilerplate code.

### Core Repository Methods


| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| **`save`** | `T entity` | `T` | Persists a new record or updates an existing one. |
| **`saveAll`** | `Iterable<T> entities` | `List<T>` | Performs batch insertion or updates for multiple records. |
| **`findById`** | `ID id` | `Optional<T>` | Retrieves a specific record by its primary key. |
| **`existsById`** | `ID id` | `boolean` | Checks if a record exists in the database. |
| **`findAll`** | *(None)* | `List<T>` | Returns a list of all records within the table. |
| **`findAll(Pageable)`** | `Pageable page` | `Page<T>` | Retrieves records in segments (essential for UI performance). |
| **`count`** | *(None)* | `long` | Returns the total number of records available. |
| **`deleteById`** | `ID id` | `void` | Removes a record based on its unique identifier. |
| **`flush`** | *(None)* | `void` | Forces immediate synchronization of changes to the database. |

> **Architecture Note:** All repositories in the project are defined as interfaces. Spring Data JPA automatically generates the implementation at runtime, ensuring a clean and maintainable backend architecture focused on business logic.

---

---

## 🎯 Vision

Umbrella is more than a platform — it's a commitment to equal access to education through technology.

---

## 👥 Leadership & Core Team

<table>
<tr>

<td align="center">
<img src="https://res.cloudinary.com/dnet6nodm/image/upload/v1764204984/Imagem_do_WhatsApp_de_2025-11-26_%C3%A0_s_21.32.00_7af69407_cfzuh6.jpg" width="140"/><br>

### Davi Henrique Teixeira Ribeiro
**Chief Executive Officer (CEO)**  
**Chief Product Officer (CPO)**  
**Chief Technology Officer (CTO)**  
**Head of Documentation**

</td>

<td align="center">
<img src="https://res.cloudinary.com/dnet6nodm/image/upload/v1764214860/Users_photos/po35oymuxiwmrj7xz9fo.png" width="140"/><br>

### Artur Henrique Lima Regadas
**Backend Engineer**  
**Software Development Analyst**

</td>

<td align="center">
<img src="https://res.cloudinary.com/dnet6nodm/image/upload/v1764205172/Imagem_do_WhatsApp_de_2025-11-26_%C3%A0_s_21.59.20_5e4bafc0_d2r7sp.jpg" width="140"/><br>

### Gabriel Nascimento Correia
**Chief Operations Officer (COO)**  
**DevOps Engineer**  
**Database Administrator**  
**Information Security Analyst**

</td>

<td align="center">
<img src="https://via.placeholder.com/150" width="140"/><br>

### Mayza Khiara de Oliveira Santos
**Chief Design Officer (CDO)**  
**Frontend Engineer**  
**UI/UX Designer**

</td>

</tr>
</table>

---

Umbrella combines executive vision, technology, design, operations, and innovation to create a new standard for accessible education.
---


## 📌 Status

🚧 In development
