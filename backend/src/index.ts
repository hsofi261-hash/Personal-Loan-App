import express, { Express, Request, Response } from 'express';
import cors from 'cors';
const PORT = process.env.PORT || 5000;
const app: Express = express();
import sequelize from  './config/database';
import fs from 'fs';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use('/api', require('./routes/mainRoute').default);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

sequelize.authenticate()
.then(async () => {
  console.log('Database connected successfully.');
  
  // THIS LINE IS CRITICAL: Forces Sequelize to create missing tables
  await sequelize.sync({ alter: true }); 
  console.log('Database synchronized.');

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('Unable to connect to the database:', err);
});