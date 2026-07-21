-- INDUSMIND AI Database Seed Schema Mappings
-- This file provides structural blueprints for PostgreSQL integration.
-- Live table creation is deferred to Alembic migrations.

-- Create Documents Metadata Table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_size INTEGER NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    ocr_text TEXT,
    knowledge_graph_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Equipment Asset Registry Table
CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    tag VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'operational',
    uptime_health NUMERIC(5,2) DEFAULT 100.00,
    temperature_telemetry NUMERIC(6,2),
    vibration_telemetry NUMERIC(5,2),
    docs_linked_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Mock Assets
INSERT INTO equipment (tag, name, location, status, uptime_health, temperature_telemetry, vibration_telemetry, docs_linked_count)
VALUES 
('PUMP-P102', 'High-Pressure Centrifugal Pump', 'Hydraulic Pump House - Section B', 'operational', 99.80, 42.00, 1.20, 3),
('TURBINE-T203', 'Superheated Gas Turbine Unit 4', 'Power Generation Block - Bldg 2', 'maintenance', 91.20, 580.00, 4.80, 8),
('BOILER-B401', 'Industrial Heat Exchange Boiler', 'Utility Boiler Room - Bldg 1', 'operational', 98.50, 210.00, 0.80, 4)
ON CONFLICT (tag) DO NOTHING;
