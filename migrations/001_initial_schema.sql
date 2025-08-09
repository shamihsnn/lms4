-- LabDesk Database Schema for Supabase
-- This creates all the tables needed for the Laboratory Management System

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    age INTEGER,
    gender VARCHAR(10),
    phone VARCHAR(15),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES admin_users(id),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modified_by INTEGER REFERENCES admin_users(id)
);

-- Create tests table
CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(20) NOT NULL UNIQUE,
    patient_id INTEGER REFERENCES patients(id),
    test_type VARCHAR(50) NOT NULL,
    test_results JSONB NOT NULL,
    normal_ranges JSONB NOT NULL,
    flags JSONB,
    test_date DATE DEFAULT CURRENT_DATE,
    test_time TIME DEFAULT CURRENT_TIME,
    status VARCHAR(20) DEFAULT 'completed',
    performed_by INTEGER REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modified_by INTEGER REFERENCES admin_users(id)
);

-- Create id_change_log table
CREATE TABLE IF NOT EXISTS id_change_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(20) NOT NULL,
    record_id INTEGER NOT NULL,
    old_id VARCHAR(20) NOT NULL,
    new_id VARCHAR(20) NOT NULL,
    changed_by INTEGER REFERENCES admin_users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT
);

-- Create test_templates table
CREATE TABLE IF NOT EXISTS test_templates (
    id SERIAL PRIMARY KEY,
    test_type VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
CREATE INDEX IF NOT EXISTS idx_tests_test_id ON tests(test_id);
CREATE INDEX IF NOT EXISTS idx_tests_patient_id ON tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_tests_test_type ON tests(test_type);
CREATE INDEX IF NOT EXISTS idx_tests_created_at ON tests(created_at);
CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);
CREATE INDEX IF NOT EXISTS idx_id_change_log_table_name ON id_change_log(table_name);
CREATE INDEX IF NOT EXISTS idx_id_change_log_record_id ON id_change_log(record_id);
CREATE INDEX IF NOT EXISTS idx_id_change_log_changed_at ON id_change_log(changed_at);

-- Insert default admin user (password: admin123)
-- Password hash is bcrypt hash of "admin123"
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (username) DO NOTHING;

-- Insert some test templates for common lab tests
INSERT INTO test_templates (test_type, parameters) VALUES
('CBC', '{
    "WBC": {"unit": "×10³/μL", "min": 4.0, "max": 11.0},
    "RBC": {"unit": "×10⁶/μL", "min": 4.5, "max": 5.9},
    "Hemoglobin": {"unit": "g/dL", "min": 14.0, "max": 18.0},
    "Hematocrit": {"unit": "%", "min": 42.0, "max": 52.0},
    "Platelets": {"unit": "×10³/μL", "min": 150, "max": 450}
}'),
('LFT', '{
    "ALT": {"unit": "U/L", "min": 7, "max": 56},
    "AST": {"unit": "U/L", "min": 10, "max": 40},
    "ALP": {"unit": "U/L", "min": 44, "max": 147},
    "Total_Bilirubin": {"unit": "mg/dL", "min": 0.3, "max": 1.2},
    "Direct_Bilirubin": {"unit": "mg/dL", "min": 0.0, "max": 0.3}
}'),
('RFT', '{
    "Creatinine": {"unit": "mg/dL", "min": 0.7, "max": 1.3},
    "BUN": {"unit": "mg/dL", "min": 7, "max": 20},
    "Uric_Acid": {"unit": "mg/dL", "min": 3.5, "max": 7.2}
}'),
('Lipid Profile', '{
    "Total_Cholesterol": {"unit": "mg/dL", "min": 0, "max": 200},
    "HDL": {"unit": "mg/dL", "min": 40, "max": 999},
    "LDL": {"unit": "mg/dL", "min": 0, "max": 100},
    "Triglycerides": {"unit": "mg/dL", "min": 0, "max": 150}
}'),
('Thyroid Function', '{
    "TSH": {"unit": "mIU/L", "min": 0.27, "max": 4.2},
    "T3": {"unit": "ng/dL", "min": 80, "max": 200},
    "T4": {"unit": "μg/dL", "min": 5.1, "max": 14.1}
}'),
('Blood Sugar', '{
    "Fasting_Glucose": {"unit": "mg/dL", "min": 70, "max": 100},
    "Random_Glucose": {"unit": "mg/dL", "min": 70, "max": 140},
    "HbA1c": {"unit": "%", "min": 4.0, "max": 5.6}
}'),
('Electrolytes', '{
    "Sodium": {"unit": "mEq/L", "min": 136, "max": 145},
    "Potassium": {"unit": "mEq/L", "min": 3.5, "max": 5.1},
    "Chloride": {"unit": "mEq/L", "min": 98, "max": 107},
    "CO2": {"unit": "mEq/L", "min": 22, "max": 28}
}'),
('Cardiac Markers', '{
    "Troponin_I": {"unit": "ng/mL", "min": 0.0, "max": 0.04},
    "CK_MB": {"unit": "ng/mL", "min": 0.0, "max": 6.3},
    "Total_CK": {"unit": "U/L", "min": 30, "max": 200}
}'),
('Urine Analysis', '{
    "Color": {"unit": "Visual", "normal": "Yellow"},
    "Appearance": {"unit": "Visual", "normal": "Clear"},
    "Specific_Gravity": {"unit": "", "min": 1.003, "max": 1.030},
    "pH": {"unit": "", "min": 4.6, "max": 8.0},
    "Protein": {"unit": "mg/dL", "normal": "Negative"},
    "Glucose": {"unit": "mg/dL", "normal": "Negative"},
    "Ketones": {"unit": "mg/dL", "normal": "Negative"},
    "Blood": {"unit": "", "normal": "Negative"},
    "Nitrites": {"unit": "", "normal": "Negative"},
    "Leukocyte_Esterase": {"unit": "", "normal": "Negative"}
}')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) for better security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE id_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- These policies allow all operations for authenticated users
-- In production, you might want more restrictive policies

CREATE POLICY "Allow all for authenticated users on admin_users" ON admin_users
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all for authenticated users on patients" ON patients
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all for authenticated users on tests" ON tests
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all for authenticated users on id_change_log" ON id_change_log
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all for authenticated users on test_templates" ON test_templates
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
