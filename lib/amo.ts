export async function fetchLead(subdomain: string, leadId: string, token: string) {
  const res = await fetch(`https://${subdomain}.amocrm.ru/api/v4/leads/${leadId}?with=contacts`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await res.json();
}

export async function fetchContact(subdomain: string, contactId: number, token: string) {
  const res = await fetch(`https://${subdomain}.amocrm.ru/api/v4/contacts/${contactId}?with=custom_fields`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await res.json();
}

export async function fetchUser(subdomain: string, userId: number, token: string) {
  const res = await fetch(`https://${subdomain}.amocrm.ru/api/v4/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await res.json();
}