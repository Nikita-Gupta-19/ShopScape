<?php
// db.php
$host = 'localhost';
$username = 'root';
$password = 'eshnasql';
$dbname = 'shopscape';

$conn = new mysqli($host, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
