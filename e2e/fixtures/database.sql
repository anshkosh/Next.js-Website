-- Disposable local browser-test database only. Never run against the VPS.
CREATE ROLE test LOGIN PASSWORD 'isolated-test-password';
CREATE DATABASE anshkosh_e2e OWNER test;
