require('dotenv').config();
const axios = require('axios');
const { Client, IntentsBitField, EmbedBuilder, InteractionResponse,ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');


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

    //console.log(interaction);
    //console.log(interaction.user.username);

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
        const OWNER_ID = '223175376820633603';

        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({
              content: '⛔ Este comando solo puede ser ejecutado por Patiño.',
              flags: 64
            });
          } 

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

    if(interaction.commandName === 'registrarse'){
        const nombre = interaction.options.get('nombre').value;
        const id = interaction.user.id;
        const username = interaction.user.username;

        //console.log(id);

        try {
            const response = await axios.post('http://localhost:8080/usuarios/registrarse', {
                nombre: nombre,
                id: id,
                usernameDiscord: username
            });

            //console.log(response);

            const embed = new EmbedBuilder()
            .setTitle(`✅ Registro Exitoso ✅`)  
            .setDescription(`Ya puedes participar en las subastas`);

            await interaction.reply({
                    embeds: [embed],
                    flags: 64
                });

            
        } catch (error) {

            const embed = new EmbedBuilder()
            .setTitle(`❌Registro FALLIDO❌`)  
            .setDescription(`${error.response.data}`);

            await interaction.reply({
                    embeds: [embed],
                    flags: 64
                });
        }
    }

    if(interaction.commandName === 'loguearse'){
        const id = interaction.user.id;
        const username = interaction.user.username;

        //console.log(id);

        try {
            const response = await axios.post('http://localhost:8080/usuarios/loguerse', {
                id: id,
                usernameDiscord: username
            });

            const embed = new EmbedBuilder()
            .setTitle(`✅ Logueo Exitoso ✅`)  
            .setDescription(`Ya puedes recibir puntos en esta session`);

            await interaction.reply({
                    embeds: [embed],
                    flags: 64
                });

            
        } catch (error) {

            const embed = new EmbedBuilder()
            .setTitle(`❌Logueo FALLIDO❌`)  
            .setDescription(`${error.response.data}`);

            await interaction.reply({
                    embeds: [embed],
                    flags: 64
                });
        }
    }

    if(interaction.commandName === 'puntos'){
        const id = interaction.user.id;
        const username = interaction.user.username;

        //console.log(id);

        try {
            const response = await axios.get(`http://localhost:8080/usuarios/obtener/puntos/${id}`);
            const data = response.data;
            const embed = new EmbedBuilder()
            .setTitle(` Tus puntos actuales `)  
            .setDescription(`${data}`);

            await interaction.reply({
                    embeds: [embed],
                    flags: 64
                });

            
        } catch (error) {
            console.log(error);
        }
    }

    if(interaction.commandName === 'puntos_globales'){

        //console.log(id);

        try {
            const response = await axios.get(`http://localhost:8080/usuarios/puntos/lista`);
            const data = response.data;

        const lista = data.map((item, index) =>
            `**${index + 1}.** ${item.nombreDelUsuario} — ${item.puntosActuales} pts`
        ).join('\n');

        const embed = new EmbedBuilder()
            .setTitle('🏆 Ranking de puntos')
            .setDescription(lista)
            .setColor(0xFFD700);

        await interaction.reply({
            embeds: [embed],
 // o false si quieres que lo vean todos
        });

            
        } catch (error) {
            console.log(error);
        }
    }

    if(interaction.commandName === 'tradear_puntos'){

        const puntos = interaction.options.getInteger('puntos');
        const usuario = interaction.options.getUser('usuario'); 

        const userId = usuario.id;
        const recipient = await client.users.fetch(userId);

        const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('accept_trade')
            .setLabel('✅ Aceptar')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('reject_trade')
            .setLabel('❌ Rechazar')
            .setStyle(ButtonStyle.Danger),
        );

        const dm = await recipient.send({
        content: `🎁 ¡Te están ofreciendo un trade de ${puntos} puntos de parte de <@${interaction.user.id}>!`,
        components: [row],
        });

        const collector = dm.createMessageComponentCollector({ time: 60_000 }); // 60s

        collector.on('collect', async i => {
        if (i.customId === 'accept_trade') {
            console.log('ACEPTO EL MARACAS')
            await i.reply({ content: '✅ Has aceptado el trade.', flags: 64 });
            collector.stop();
        } else if (i.customId === 'reject_trade') {
            console.log('CENCELO EL MARACAS')
            await i.reply({ content: '❌ Has rechazado el trade.', flags: 64 });
            collector.stop();
        }
        });

        collector.on('end', (_, reason) => {
        if (reason === 'time') {
            dm.edit({ content: '⏰ Trade expirado.', components: [] });
        }
        });

        interaction.reply('El tradeo se envio');
    }
});

client.login(process.env.TOKEN);