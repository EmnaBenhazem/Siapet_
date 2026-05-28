import { io } from "socket.io-client";
import config from "../config";

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket) {
      return;
    }

    this.socket = io(config.apiUrl.replace("/api", ""), {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      // Rejoindre la room selon le rôle de l'utilisateur
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      // Le rôle est stocké dans 'role' après le login
      let userRole = user.role;
      if (userRole) {
        // Convertir en majuscules
        let roleUpper = userRole.toUpperCase();

        // Cas spécial: ADMIN doit rejoindre la room ADMIN_MESRS
        if (roleUpper === "ADMIN") {
          roleUpper = "ADMIN_MESRS";
        }

        this.socket.emit("join-role", roleUpper);
      }
    });

    this.socket.on("disconnect", () => {
      // Socket déconnecté
    });

    this.socket.on("connect_error", (error) => {
      console.error("Erreur Socket:", error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      // Quitter toutes les rooms avant de déconnecter
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      let userRole = user.role;
      if (userRole) {
        let roleUpper = userRole.toUpperCase();

        // Cas spécial: ADMIN doit quitter la room ADMIN_MESRS
        if (roleUpper === "ADMIN") {
          roleUpper = "ADMIN_MESRS";
        }

        this.socket.emit("leave-role", roleUpper);
      }

      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Écouter un événement
  on(event, callback) {
    if (!this.socket) {
      console.warn("⚠️ Socket non connecté");
      return;
    }

    this.socket.on(event, callback);

    // Stocker le listener pour pouvoir le supprimer plus tard
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Arrêter d'écouter un événement
  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);

      // Retirer du stockage
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    } else {
      // Retirer tous les listeners pour cet événement
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  // Émettre un événement
  emit(event, data) {
    if (!this.socket) {
      console.warn("⚠️ Socket non connecté");
      return;
    }

    this.socket.emit(event, data);
  }

  // Vérifier si connecté
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Instance singleton
const socketService = new SocketService();

export default socketService;
