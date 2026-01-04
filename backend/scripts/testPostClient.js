const axios = require('axios');

async function run(){
  try{
    const payload = {
      date: new Date().toISOString().split('T')[0],
      records: [
        { student: '6952151819a5830be46d7bd9', status: 'present' }
      ]
    };
    console.log('Client: sending payload', payload);
    const res = await axios.post('http://localhost:5000/api/attendance', payload);
    console.log('Client: response', res.status, res.data);
  }catch(err){
    if(err.response){
      console.error('Client: error response', err.response.status, err.response.data);
    } else {
      console.error('Client: error', err.message);
    }
    process.exit(1);
  }
}
run();
