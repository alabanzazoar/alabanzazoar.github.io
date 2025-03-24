<?php
$host = 'database-1.c5syiy0mkuwt.us-east-2.rds.amazonaws.com';
$dbname = 'database-1';
$username = 'admin';
$password = 'Alabanza1234*';

$response = array();

// Crear conexión
$conn = new mysqli($host, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    $response['status'] = 'No';
    $response['message'] = 'Conexión fallida: ' . $conn->connect_error;
} else {
    $response['status'] = 'Si';
    $response['message'] = 'Conexión exitosa';
}

// Cerrar conexión
$conn->close();

// Devolver respuesta en formato JSON
echo json_encode($response);
?>