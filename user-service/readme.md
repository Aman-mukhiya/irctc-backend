# How otp is generated ?

-> first we pass the meta to the function 
    meta consists of following
    meta = { firstName, lastName, email, hashedPassword};

# User can generate otp only 5 times 

# User can verify otp only 5 times 
-> so we check the session id in the redis and them update after each check and also store the update value in the redis
