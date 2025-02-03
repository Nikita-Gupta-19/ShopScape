<?php
if ($_SERVER['REQUEST_METHOD'] == "POST") {
    include 'db.php';

    $username = $_POST['username'];
    $password = $_POST['password'];

    $sql = "SELECT * FROM users WHERE username='$username'"; // Space after SELECT
    $result = mysqli_query($conn, $sql);

    if (!$result) {
        die("Query failed: " . mysqli_error($conn));
    }

    $row = mysqli_fetch_assoc($result); // Fetch only once
    if ($row) {
        if (password_verify($password, $row['password'])) {
            header("Location: index.html");
            exit;
        } else {
            echo '<script>alert("Invalid Credentials")</script>';
        }
    } else {
        echo '<script>alert("Invalid Credentials")</script>';
    }
}
?>
