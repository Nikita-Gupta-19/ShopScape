<?php

if ($_SERVER['REQUEST_METHOD'] == "POST") {
    include 'db.php';

    $name = $_POST['name'];
    $username = $_POST['username'];
    $password = $_POST['password'];
    $phonenumber = $_POST['phonenumber']; // Ensure this matches the input name
    $dob = $_POST['dob'];
    $address = $_POST['address'];
    $email = $_POST['email'];

    $existSql = "SELECT * FROM users WHERE username ='$username'";
    $resultExist = mysqli_query($conn, $existSql);

    if (!$resultExist) {
        die("Query failed: " . mysqli_error($conn)); 
    }

    $numExist = mysqli_num_rows($resultExist);
    if ($numExist > 0) {
        echo '<script>alert("Username already exists")</script>';
    } else {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $sql = "INSERT INTO users (username, name, email, password, address, phonenumber, dob) VALUES ('$username', '$name', '$email', '$hashedPassword', '$address', '$phonenumber', '$dob')";

        $result = mysqli_query($conn, $sql);
        if (!$result) {
            die("Query failed: " . mysqli_error($conn) . " Query: " . $sql);
        }
        
        header("Location: http://localhost/shopscape/index.html");
        exit; 
    } 
}
?>
