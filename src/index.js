require('dotenv').config();
const axios = require('axios');
const { Client, IntentsBitField, EmbedBuilder, InteractionResponse } = require('discord.js');


const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.on('ready', (c) => {
    console.log('El bot esta listoo.');
});

client.on('interactionCreate', async (interaction) => {
    if(!interaction.isChatInputCommand()) return;

    console.log(interaction);
    console.log(interaction.user.username);

    if(interaction.commandName === 'subasta'){


        const nombreItem = interaction.options.get('nombre_item').value;

        try {
            const response = await axios.post(`http://localhost:8080/subasta/iniciar/${nombreItem}`);
            console.log(response);

            const embed = new EmbedBuilder()
            .setTitle(`Nombre del Item: ${nombreItem}`)  
            .setDescription(`Id de la subata: ${response.data.id}`);
            //`El Id de la suba del item ${nombreItem} es : ${response.data.id}`
            await interaction.reply({embeds: [embed]});
        } catch (error) {
            console.error('Error al llamar al backend:', error);
            await interaction.reply('Error al consultar el backend.');
        }
    }

    if(interaction.commandName === 'pujar'){
        const valorAPujar = interaction.options.get('valor_a_pujar').value;
        const idDeLaSubasta = interaction.options.get('id_de_la_subata').value;
        const username = interaction.user.username;

        try {
            const response = await axios.post('http://localhost:8080/subasta/pujar', {
                idSubasta: idDeLaSubasta,
                monto: valorAPujar,
                usuario: username
            });
            console.log(response);
            await interaction.reply(`El usuario ${username} ha pujado ${valorAPujar}`);
        } catch (error) {
            console.error('Error al llamar al backend:', error);
            await interaction.reply('Error al consultar el backend.');
        }
    }

    if(interaction.commandName === 'terminar'){
        const idDeLaSubasta = interaction.options.get('id_de_la_subata').value;

        try {
            const response = await axios.post('http://localhost:8080/subasta/terminar', {
                idSubasta: '1',
                nombreDelItem: 'pruba'
            });
            console.log(response);
            await interaction.reply(`El ganador de la subata es: ${response.data.nombreUsuario} pujado ${response.data.puntosUsados}`);
        } catch (error) {
            console.error('Error al llamar al backend:', error);
            await interaction.reply('Error al consultar el backend.');
        }
    }

    if(interaction.commandName === 'otorgar'){
        const puntos = interaction.options.get('puntos').value;

        try {
            const response = await axios.post(`http://localhost:8080/usuarios/otorgar/puntos/${puntos}`);
            console.log(response);

            const userIds  = response.data

            for (const userId of userIds) {
                try {
                    const user = await client.users.fetch(userId);
                    await user.send(`🎉 Has recibido ${puntos} puntos!`);

                    await interaction.reply({
                        content: '✅ Puntos otorgados.',
                        flags: 64
                    })
                } catch (error) {
                    console.error(`❌ No pude enviar mensaje a ${userId}:`, error);
                }
            }

            
        } catch (error) {
            console.error('Error al llamar al backend:', error);
            await interaction.reply('Error al consultar el backend.');
        }
    }

});

client.login(process.env.TOKEN);