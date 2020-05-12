k6 run ./clean_db.js

k6 run ./load_db.js

k6 run ./user_scenario.js

k6 run ./wharehouse_integrity.js