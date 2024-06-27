var db = null

function open(pathname) {
  db = sqlite(pathname)

  db.exec(`
    CREATE TABLE IF NOT EXISTS meshes (
      name TEXT PRIMARY KEY,
      ca TEXT NOT NULL,
      agent TEXT NOT NULL,
      bootstraps TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps (
      mesh TEXT NOT NULL,
      name TEXT NOT NULL,
      tag TEXT NOT NULL,
      provider TEXT NOT NULL,
      username TEXT NOT NULL,
      state TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS storage (
      mesh TEXT NOT NULL,
      name TEXT NOT NULL,
      tag TEXT NOT NULL,
      provider TEXT NOT NULL,
      path TEXT NOT NULL,
      data TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      mesh TEXT NOT NULL,
      name TEXT NOT NULL,
      protocol TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER NOT NULL,
      users TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS ports (
      mesh TEXT NOT NULL,
      ip TEXT NOT NULL,
      port INTEGER NOT NULL,
      protocol TEXT NOT NULL,
      endpoint TEXT,
      service TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      mesh TEXT NOT NULL,
      id TEXT NOT NULL,
      name TEXT,
      roomType TEXT,
      endpoints TEXT,
      unreadCount INTEGER DEFAULT 0
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mesh TEXT NOT NULL,
      roomId TEXT,
      read INTEGER DEFAULT 0,
      send INTEGER DEFAULT 0,
      text TEXT,
      files TEXT,
      time TEXT,
      endpoint TEXT
    )
  `)
}

function recordToMesh(rec) {
  return {
    name: rec.name,
    ca: rec.ca,
    agent: JSON.parse(rec.agent),
    bootstraps: rec.bootstraps.split(','),
  }
}

function allMeshes() {
  return (
    db.sql('SELECT * FROM meshes')
      .exec()
      .map(recordToMesh)
  )
}

function getMesh(name) {
  return (
    db.sql('SELECT * FROM meshes WHERE name = ?')
      .bind(1, name)
      .exec()
      .slice(0, 1)
      .map(recordToMesh)[0]
  )
}

function setMesh(name, mesh) {
  var old = getMesh(name)
  if (old) {
    mesh = { ...old, ...mesh }
    var agent = { ...old.agent, ...mesh.agent }
    agent.id = old.agent.id
    db.sql('UPDATE meshes SET ca = ?, agent = ?, bootstraps = ? WHERE name = ?')
      .bind(1, mesh.ca || '')
      .bind(2, JSON.stringify(agent))
      .bind(3, mesh.bootstraps.join(','))
      .bind(4, name)
      .exec()
  } else {
    var agent = mesh.agent
    agent.id = algo.uuid()
    db.sql('INSERT INTO meshes(name, ca, agent, bootstraps) VALUES(?, ?, ?, ?)')
      .bind(1, name)
      .bind(2, mesh.ca || '')
      .bind(3, JSON.stringify(agent))
      .bind(4, mesh.bootstraps.join(','))
      .exec()
  }
}

function delMesh(name) {
  db.sql('DELETE FROM ports WHERE mesh = ?')
    .bind(1, name)
    .exec()
  db.sql('DELETE FROM services WHERE mesh = ?')
    .bind(1, name)
    .exec()
  db.sql('DELETE FROM apps WHERE mesh = ?')
    .bind(1, name)
    .exec()
  db.sql('DELETE FROM meshes WHERE name = ?')
    .bind(1, name)
    .exec()
}

function recordToApp(rec) {
  return {
    provider: rec.provider,
    name: rec.name,
    tag: rec.tag,
    username: rec.username,
    state: rec.state,
  }
}

function allApps(mesh) {
  return (
    db.sql('SELECT * FROM apps WHERE mesh = ?')
      .bind(1, mesh)
      .exec()
      .map(recordToApp)
  )
}

function getApp(mesh, provider, name, tag) {
  return (
    db.sql('SELECT * FROM apps WHERE mesh = ? AND provider = ? AND name = ? AND tag = ?')
      .bind(1, mesh)
      .bind(2, provider)
      .bind(3, name)
      .bind(4, tag)
      .exec()
      .slice(0, 1)
      .map(recordToApp)[0]
  )
}

function setApp(mesh, provider, name, tag, app) {
  var old = getApp(mesh, provider, name, tag)
  if (old) {
    db.sql('UPDATE apps SET username = ?, state = ? WHERE mesh = ? AND provider = ? AND name = ? AND tag = ?')
      .bind(1, 'username' in app ? app.username : old.username)
      .bind(2, 'state' in app ? app.state : old.state)
      .bind(3, mesh)
      .bind(4, provider)
      .bind(5, name)
      .bind(6, tag)
      .exec()
  } else {
    db.sql('INSERT INTO apps(mesh, provider, name, tag, username, state) VALUES(?, ?, ?, ?, ?, ?)')
      .bind(1, mesh)
      .bind(2, provider)
      .bind(3, name)
      .bind(4, tag)
      .bind(5, app.username || '')
      .bind(6, app.state || '')
      .exec()
  }
}

function delApp(mesh, provider, name, tag) {
  db.sql('DELETE FROM apps WHERE mesh = ? AND provider = ? AND name = ? AND tag = ?')
    .bind(1, mesh)
    .bind(2, provider)
    .bind(3, name)
    .bind(4, tag)
    .exec()
}

function recordToService(rec) {
  return {
    name: rec.name,
    protocol: rec.protocol,
    host: rec.host,
    port: Number.parseInt(rec.port),
    users: JSON.parse(rec.users),
  }
}

function allServices(mesh) {
  if (mesh) {
    return (
      db.sql('SELECT * FROM services WHERE mesh = ?')
        .bind(1, mesh)
        .exec()
        .map(recordToService)
    )
  } else {
    return (
      db.sql('SELECT * FROM services')
        .exec()
        .map(recordToService)
    )
  }
}

function getService(mesh, proto, name) {
  return (
    db.sql('SELECT * FROM services WHERE mesh = ? AND name = ? AND protocol = ?')
      .bind(1, mesh)
      .bind(2, name)
      .bind(3, proto)
      .exec()
      .slice(0, 1)
      .map(recordToService)[0]
  )
}

function setService(mesh, proto, name, service) {
  var old = getService(mesh, proto, name)
  if (old) {
    service = { ...old, ...service }
    db.sql('UPDATE services SET host = ?, port = ?, users = ? WHERE mesh = ? AND name = ? AND protocol = ?')
      .bind(1, service.host)
      .bind(2, service.port)
      .bind(3, JSON.stringify(service.users || null))
      .bind(4, mesh)
      .bind(5, name)
      .bind(6, proto)
      .exec()
  } else {
    db.sql('INSERT INTO services(mesh, name, protocol, host, port, users) VALUES(?, ?, ?, ?, ?, ?)')
      .bind(1, mesh)
      .bind(2, name)
      .bind(3, proto)
      .bind(4, service.host)
      .bind(5, service.port)
      .bind(6, JSON.stringify(service.users || null))
      .exec()
  }
}

function delService(mesh, proto, name) {
  db.sql('DELETE FROM services WHERE mesh = ? AND name = ? AND protocol = ?')
    .bind(1, mesh)
    .bind(2, name)
    .bind(3, proto)
    .exec()
}

function recordToPort(rec) {
  return {
    protocol: rec.protocol,
    listen: {
      ip: rec.ip,
      port: Number.parseInt(rec.port),
    },
    target: {
      endpoint: rec.endpoint,
      service: rec.service,
    }
  }
}

function allPorts(mesh) {
  if (mesh) {
    return (
      db.sql('SELECT * FROM ports WHERE mesh = ?')
        .bind(1, mesh)
        .exec()
        .map(recordToPort)
    )
  } else {
    return (
      db.sql('SELECT * FROM ports')
        .exec()
        .map(recordToPort)
    )
  }
}

function getPort(mesh, ip, proto, port) {
  return (
    db.sql('SELECT * FROM ports WHERE mesh = ? AND ip = ? AND protocol = ? AND port = ?')
      .bind(1, mesh)
      .bind(2, ip)
      .bind(3, proto)
      .bind(4, port)
      .exec()
      .slice(0, 1)
      .map(recordToPort)[0]
  )
}

function setPort(mesh, ip, proto, port, { target }) {
  var old = getPort(mesh, ip, proto, port)
  if (old) {
    db.sql('UPDATE ports SET endpoint = ?, service = ? WHERE mesh = ? AND ip = ? AND protocol = ? AND port = ?')
      .bind(1, target.endpoint)
      .bind(2, target.service)
      .bind(3, mesh)
      .bind(4, ip)
      .bind(5, proto)
      .bind(6, port)
      .exec()
  } else {
    db.sql('INSERT INTO ports(mesh, ip, protocol, port, endpoint, service) VALUES(?, ?, ?, ?, ?, ?)')
      .bind(1, mesh)
      .bind(2, ip)
      .bind(3, proto)
      .bind(4, port)
      .bind(5, target.endpoint)
      .bind(6, target.service)
      .exec()
  }
}

function delPort(mesh, ip, proto, port) {
  db.sql('DELETE FROM ports WHERE mesh = ? AND ip = ? AND protocol = ? AND port = ?')
    .bind(1, mesh)
    .bind(2, ip)
    .bind(3, proto)
    .bind(4, port)
    .exec()
}

function createRoom(mesh, id, name, roomType, endpoints) {
  db.sql('INSERT INTO rooms(mesh, id, name, roomType, endpoints) VALUES(?, ?, ?, ?, ?)')
  .bind(1, mesh)
  .bind(2, id)
  .bind(3, name)
  .bind(4, roomType)
  .bind(5, endpoints)
  .exec()
}

function createMessage(mesh, room, text, files, endpoint) {
  db.sql('INSERT INTO messages(mesh, roomId, text, files, time, endpoint) VALUES(?, ?, ?, ?, ?, ?)')
  .bind(1, mesh)
  .bind(2, room)
  .bind(3, text)
  .bind(4, JSON.stringify(files))
  .bind(5, new Date().getTime().toString())
  .bind(6, endpoint)
  .exec()

  db.sql('UPDATE rooms SET unreadCount = unreadCount + 1 WHERE mesh = ? AND id = ?')
    .bind(1, mesh)
    .bind(2, room)
    .exec()

  return (
    db.sql('SELECT * FROM messages WHERE mesh = ? AND roomId = ? ORDER BY time DESC LIMIT 1')
      .bind(1, mesh)
      .bind(2, room)
      .exec()
      .slice(0, 1)
      .map(recordToMessage)[0]
  )
}
function getRoom(mesh, id) {
  return (
    db.sql('SELECT * FROM rooms WHERE mesh = ? AND id = ?')
      .bind(1, mesh)
      .bind(2, id)
      .exec()
      .slice(0, 1)
      .map(recordToRoom)[0]
  )
}

function getRooms(mesh) {
  return (
    db.sql(`
SELECT r.*, m.id as messageId, m.time, m.text, m.files, m.endpoint FROM rooms r
LEFT JOIN (
	SELECT *, ROW_NUMBER() OVER (PARTITION BY roomid ORDER BY time DESC) AS rn
    FROM messages 
) m ON r.id = m.roomId 
WHERE r.mesh = ?;`)
      .bind(1, mesh)
      .exec()
      .map(recordToRoom)
  )
}

function recordToRoom(rec) {
  var room = {
    mesh: rec.mesh,
    id: rec.id,
    name: rec.name,
    roomType: rec.roomType,
    target: {type: rec.roomType},
    unread: rec.unreadCount
  }
  if (rec.roomType == "single") {
    room.target.ep = rec.endpoints
  } else {
    room.target.eps = rec.endpoints.split(",")
  }

  if (rec.endpoint) {
    room.time = rec.time
    var last = {}
    if (rec.files) {
      var files = JSON.parse(rec.files)
      last.text = `[${files?.[0].type}]`
    } else {
      last.text = rec.text
    }
  }
  return room
}

function getMessages(mesh, room, params, onlyFiles) {
  var sql = "SELECT * FROM messages WHERE roomId=? ORDER BY time DESC limit 0 OFFSET 1"
  if (params?.date) {
    return (
      db.sql("SELECT * FROM messages WHERE mesh=? AND roomId=? AND strftime('%Y%m%d', time)=? ORDER BY time DESC")
      .bind(1, mesh)
      .bind(2, room)
      .bind(3, params?.date)
      .exec()
      .map(recordToMessage)
      .reverse()
    )
  } else {
    var offset = 0
    var limit = 50
    if (params?.page && params?.size) {
      limit = params?.size
      offset = (params?.page * params?.size) - 1 
    }
    var sql = null;
    if (onlyFiles) {
      sql = "SELECT * FROM messages WHERE mesh=? AND roomId=? AND files IS NOT NULL ORDER BY time DESC LIMIT ? OFFSET ?"
    } else {
      sql = "SELECT * FROM messages WHERE mesh=? AND roomId=? ORDER BY time DESC LIMIT ? OFFSET ?"
    }
    return (
      db.sql(sql)
      .bind(1, mesh)
      .bind(2, room)
      .bind(3, limit)
      .bind(4, offset)
      .exec()
      .map(recordToMessage)
      .reverse()
    )
  }
}
function recordToMessage(rec) {
  var room = {
    id: rec.id,
    time: rec.time,
    endpoint: rec.endpoint,
  }
  if (rec.files) {
    room.files = JSON.parse(rec.files)
  } else {
    room.text = rec.text
  }
  return room
}

function readMessage(mesh, room) {
  db.sql('UPDATE messages SET read = 1 WHERE mesh = ? AND roomId = ?')
    .bind(1, mesh)
    .bind(2, room)
    .exec()

  db.sql('UPDATE rooms SET unreadCount = 0 WHERE mesh = ? AND id = ?')
    .bind(1, mesh)
    .bind(2, room)
    .exec()
}

function deleteRoom(mesh, room) {
  db.sql('DELETE FROM rooms WHERE mesh = ? AND id = ?')
    .bind(1, mesh)
    .bind(2, room)
    .exec()
  
  db.sql('DELETE FROM messages WHERE mesh = ? AND roomId = ?')
    .bind(1, mesh)
    .bind(2, room)
    .exec()
}

function deleteMessage(mesh, room, id) {
  db.sql('DELETE FROM messages WHERE mesh = ? AND roomId = ? AND id = ?')
    .bind(1, mesh)
    .bind(2, room)
    .bind(3, id)
    .exec()
}

export default {
  open,
  allMeshes,
  getMesh,
  setMesh,
  delMesh,
  allApps,
  getApp,
  setApp,
  delApp,
  allServices,
  getService,
  setService,
  delService,
  allPorts,
  getPort,
  setPort,
  delPort,
  createRoom,
  getRoom,
  getRooms,
  getMessages,
  readMessage,
  deleteRoom,
  createMessage,
  deleteMessage,
}
