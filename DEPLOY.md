# 🚀 Guía de Despliegue en Render

## 📋 Configuración en Render

### Paso 1: Configuración Básica
```
Name: Gestion_Citas_Medicas_MongoDB
Environment: Production
Language: Node
Branch: main
Region: Virginia (US East)
```

### Paso 2: Root Directory
```
Root Directory: backend
```
⚠️ **IMPORTANTE**: Escribe `backend` en el campo Root Directory porque tu código del servidor está en esa carpeta.

### Paso 3: Comandos de Build y Start
```bash
Build Command: npm install
Start Command: npm start
```

⚠️ **Cambia "yarn" por "npm"** en los comandos que te muestra Render.

### Paso 4: Instance Type
```
Instance Type: Free ($0/month)
```

## 🔐 Variables de Entorno

Después de crear el servicio, ve a **Environment** y agrega:

### Variable Requerida:
```
MONGODB_URI = mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/gestion_citas_medicas?retryWrites=true&w=majority
```

### Variables Opcionales:
```
NODE_ENV = production
PORT = 3000
```

⚠️ **IMPORTANTE**: 
- Reemplaza `<USERNAME>`, `<PASSWORD>` y `<CLUSTER>` con tus credenciales reales de MongoDB Atlas
- El nombre de la base de datos debe coincidir con el que usas en Atlas

## 📝 Pasos Completos

1. **Sube tu código a GitHub** (si no lo has hecho):
   ```bash
   git add .
   git commit -m "Preparado para despliegue en Render"
   git push origin main
   ```

2. **En Render**:
   - Click en "Create Web Service"
   - Conecta tu repositorio: `jjvnz/Gestion_Citas_Medicas_MongoDB`
   - Configura los valores mencionados arriba
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Agrega Variables de Entorno**:
   - Después de crear el servicio
   - Ve a la pestaña "Environment"
   - Click en "Add Environment Variable"
   - Agrega `MONGODB_URI` con tu cadena de conexión de Atlas

4. **Deploy**:
   - Render automáticamente desplegará tu aplicación
   - Espera 2-3 minutos

## 🌐 Acceder a tu Aplicación

Una vez desplegado, Render te dará una URL como:
```
https://gestion-citas-medicas-mongodb.onrender.com
```

Tu aplicación estará disponible en esa URL. El frontend se servirá automáticamente desde la raíz.

## 🔍 Verificar que Funciona

Prueba estos endpoints:
- `https://tu-app.onrender.com/` - Frontend
- `https://tu-app.onrender.com/api/health` - Estado del servidor
- `https://tu-app.onrender.com/api/info` - Información del sistema

## ⚠️ Notas Importantes

### Sobre el Tier Gratuito:
- ✅ Tu app estará disponible 24/7
- ⚠️ Se "duerme" tras 15 minutos de inactividad
- ⏱️ Primera petición tras inactividad tarda ~30 segundos
- 💡 Peticiones subsecuentes son instantáneas

### MongoDB Atlas:
- ✅ Tu cadena de conexión se mantiene segura en las variables de entorno
- ✅ Asegúrate de tener MongoDB Atlas en el tier gratuito (M0)
- ⚠️ Verifica que tu IP de Render esté en la whitelist de Atlas (o permite todas: 0.0.0.0/0)

## 🔧 Solución de Problemas

### Error: "Application failed to start"
- Verifica que `Root Directory` sea `backend`
- Verifica que los comandos sean `npm install` y `npm start`
- Revisa los logs en Render

### Error: "Cannot connect to database"
- Verifica que `MONGODB_URI` esté configurada correctamente
- Verifica que tu IP esté permitida en MongoDB Atlas Network Access
  - Ve a MongoDB Atlas → Network Access
  - Agrega `0.0.0.0/0` para permitir todas las IPs

### La app se carga lento:
- Normal en tier gratuito tras inactividad
- Considera upgrade a plan de pago ($7/mes) si necesitas respuesta inmediata

## 📊 Monitoreo

En el dashboard de Render puedes ver:
- Logs en tiempo real
- Métricas de uso
- Estado del deploy
- Variables de entorno

## 🔄 Actualizaciones

Para actualizar tu aplicación:
```bash
git add .
git commit -m "Actualización de la aplicación"
git push origin main
```

Render automáticamente detectará el cambio y re-desplegará.

## 💡 Próximos Pasos

1. ✅ Despliega la aplicación siguiendo esta guía
2. 🧪 Prueba todos los endpoints
3. 📱 Comparte la URL con usuarios
4. 📊 Monitorea el uso en el dashboard de Render
5. 🚀 Considera upgrade si necesitas eliminar el "sleep" del servidor

---

**¿Necesitas ayuda?** Revisa los logs en Render o contacta soporte.
