import sys
sys.stdout.reconfigure(encoding='utf-8')

import psycopg2

conn = psycopg2.connect(
    host='db',
    port=5432,
    dbname='indusmind_db',
    user='indusmind_user',
    password='indusmind_password'
)
cur = conn.cursor()

# List users
cur.execute("SELECT id, email, role, is_active, is_verified FROM users ORDER BY id")
rows = cur.fetchall()
print(f'All users ({len(rows)}):')
for row in rows:
    print(f'  id={row[0]} | {row[1]} | role={row[2]} | active={row[3]} | verified={row[4]}')

# Fix admin role
cur.execute("""
    UPDATE users 
    SET role = 'Super Admin', is_verified = true, is_active = true
    WHERE email = 'admin@indusmind.com'
""")
affected = cur.rowcount
conn.commit()
print(f'\nUpdated {affected} user(s) to Super Admin')

# Check documents
cur.execute("SELECT id, document_name, indexing_status FROM documents")
docs = cur.fetchall()
print(f'\nDocuments ({len(docs)}):')
for d in docs:
    cur.execute("SELECT COUNT(*) FROM document_chunks WHERE document_id = %s", (d[0],))
    chunk_count = cur.fetchone()[0]
    print(f'  id={d[0]} | {d[1]} | status={d[2]} | chunks={chunk_count}')

# Check organizations
cur.execute("SELECT id, name FROM organizations")
orgs = cur.fetchall()
print(f'\nOrganizations ({len(orgs)}):')
for o in orgs:
    print(f'  id={o[0]} | {o[1]}')

cur.close()
conn.close()
print('\nDone!')
