import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Middleware to verify auth token
async function verifyAuth(accessToken: string) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return null;
    }
    return user;
  } catch (error) {
    console.log('Auth verification error:', error);
    return null;
  }
}

// Health check endpoint
app.get("/make-server-090ebd00/health", (c) => {
  return c.json({ status: "ok" });
});

// User registration
app.post("/make-server-090ebd00/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    // All new users are created as observers
    const role = 'observer';
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role,
      createdAt: new Date().toISOString()
    });

    return c.json({ user: data.user });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Projects endpoints
app.get("/make-server-090ebd00/projects", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await verifyAuth(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projects = await kv.getByPrefix('project:');
    return c.json({ projects });
  } catch (error) {
    console.log('Get projects error:', error);
    return c.json({ error: 'Internal server error while fetching projects' }, 500);
  }
});

app.post("/make-server-090ebd00/projects", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await verifyAuth(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name, description, startDate, endDate } = await c.req.json();
    const projectId = crypto.randomUUID();
    
    const project = {
      id: projectId,
      name,
      description,
      startDate,
      endDate,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    await kv.set(`project:${projectId}`, project);
    return c.json({ project });
  } catch (error) {
    console.log('Create project error:', error);
    return c.json({ error: 'Internal server error while creating project' }, 500);
  }
});

// Defects endpoints
app.get("/make-server-090ebd00/defects", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await verifyAuth(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const defects = await kv.getByPrefix('defect:');
    return c.json({ defects });
  } catch (error) {
    console.log('Get defects error:', error);
    return c.json({ error: 'Internal server error while fetching defects' }, 500);
  }
});

app.post("/make-server-090ebd00/defects", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await verifyAuth(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { title, description, priority, assignee, projectId, dueDate } = await c.req.json();
    const defectId = crypto.randomUUID();
    
    const defect = {
      id: defectId,
      title,
      description,
      priority,
      assignee,
      projectId,
      dueDate,
      status: 'Новая',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: []
    };

    await kv.set(`defect:${defectId}`, defect);
    
    // Create history entry
    const historyEntry = {
      id: crypto.randomUUID(),
      defectId,
      action: 'created',
      userId: user.id,
      timestamp: new Date().toISOString(),
      details: 'Дефект создан'
    };
    
    await kv.set(`history:${defectId}:${historyEntry.id}`, historyEntry);
    
    return c.json({ defect });
  } catch (error) {
    console.log('Create defect error:', error);
    return c.json({ error: 'Internal server error while creating defect' }, 500);
  }
});

app.put("/make-server-090ebd00/defects/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await verifyAuth(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const defectId = c.req.param('id');
    const updates = await c.req.json();
    
    const existingDefect = await kv.get(`defect:${defectId}`);
    if (!existingDefect) {
      return c.json({ error: 'Defect not found' }, 404);
    }

    const updatedDefect = {
      ...existingDefect,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`defect:${defectId}`, updatedDefect);
    
    // Create history entry
    const historyEntry = {
      id: crypto.randomUUID(),
      defectId,
      action: 'updated',
      userId: user.id,
      timestamp: new Date().toISOString(),
      details: `Дефект обновлен: ${Object.keys(updates).join(', ')}`
    };
    
    await kv.set(`history:${defectId}:${historyEntry.id}`, historyEntry);
    
    return c.json({ defect: updatedDefect });
  } catch (error) {
    console.log('Update defect error:', error);
    return c.json({ error: 'Internal server error while updating defect' }, 500);
  }
});

app.get("/make-server-090ebd00/defects/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await verifyAuth(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const defectId = c.req.param('id');
    const defect = await kv.get(`defect:${defectId}`);
    
    if (!defect) {
      return c.json({ error: 'Defect not found' }, 404);
    }

    const history = await kv.getByPrefix(`history:${defectId}:`);
    
    return c.json({ defect, history });
  } catch (error) {
    console.log('Get defect error:', error);
    return c.json({ error: 'Internal server error while fetching defect' }, 500);
  }
});

// Add comment to defect
app.post("/make-server-090ebd00/defects/:id/comments", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await verifyAuth(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const defectId = c.req.param('id');
    const { comment } = await c.req.json();
    
    const defect = await kv.get(`defect:${defectId}`);
    if (!defect) {
      return c.json({ error: 'Defect not found' }, 404);
    }

    const newComment = {
      id: crypto.randomUUID(),
      author: user.id,
      comment,
      timestamp: new Date().toISOString()
    };

    defect.comments = defect.comments || [];
    defect.comments.push(newComment);
    
    await kv.set(`defect:${defectId}`, defect);
    
    return c.json({ comment: newComment });
  } catch (error) {
    console.log('Add comment error:', error);
    return c.json({ error: 'Internal server error while adding comment' }, 500);
  }
});

// Analytics endpoint
app.get("/make-server-090ebd00/analytics", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await verifyAuth(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const defects = await kv.getByPrefix('defect:');
    
    const statusCount = {};
    const priorityCount = {};
    let totalDefects = 0;
    let overdue = 0;
    
    for (const defect of defects) {
      totalDefects++;
      
      statusCount[defect.status] = (statusCount[defect.status] || 0) + 1;
      priorityCount[defect.priority] = (priorityCount[defect.priority] || 0) + 1;
      
      if (defect.dueDate && new Date(defect.dueDate) < new Date() && defect.status !== 'Закрыта') {
        overdue++;
      }
    }
    
    return c.json({
      totalDefects,
      overdue,
      statusCount,
      priorityCount
    });
  } catch (error) {
    console.log('Analytics error:', error);
    return c.json({ error: 'Internal server error while fetching analytics' }, 500);
  }
});

// Get users
app.get("/make-server-090ebd00/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await verifyAuth(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const users = await kv.getByPrefix('user:');
    return c.json({ users });
  } catch (error) {
    console.log('Get users error:', error);
    return c.json({ error: 'Internal server error while fetching users' }, 500);
  }
});

// Update user role (admin only)
app.put("/make-server-090ebd00/users/:id/role", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const adminUser = await verifyAuth(accessToken);
    if (!adminUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if the user has admin privileges
    const adminProfile = await kv.get(`user:${adminUser.id}`);
    if (!adminProfile || adminProfile.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const userId = c.req.param('id');
    const { role } = await c.req.json();

    // Validate role
    const validRoles = ['observer', 'engineer', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }

    // Get user profile
    const userProfile = await kv.get(`user:${userId}`);
    if (!userProfile) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Update user profile
    const updatedProfile = {
      ...userProfile,
      role,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`user:${userId}`, updatedProfile);

    // Update Supabase auth metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...userProfile,
        role
      }
    });

    return c.json({ user: updatedProfile });
  } catch (error) {
    console.log('Update user role error:', error);
    return c.json({ error: 'Internal server error while updating user role' }, 500);
  }
});

Deno.serve(app.fetch);